// speech-proxy.js - Упрощенный и надежный прокси-сервер для Yandex SpeechKit
// Версия 2.4 - безопасность, rate limiting, валидация

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== БЕЗОПАСНОСТЬ ====================

// Ограниченный CORS - только собственный домен + localhost для разработки
const ALLOWED_ORIGINS = [
    'https://jms.up.railway.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type']
}));

// CSP-заголовки
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Rate limiting - простая реализация без зависимостей
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута
const RATE_LIMIT_MAX = 30; // максимум 30 запросов в минуту

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, windowStart: now });
        return next();
    }

    const record = requestCounts.get(ip);

    if (now - record.windowStart > RATE_LIMIT_WINDOW) {
        record.count = 1;
        record.windowStart = now;
        return next();
    }

    record.count++;

    if (record.count > RATE_LIMIT_MAX) {
        return res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - record.windowStart)) / 1000)
        });
    }

    next();
}

// Очистка старых записей каждые 5 минут
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requestCounts.entries()) {
        if (now - record.windowStart > RATE_LIMIT_WINDOW) {
            requestCounts.delete(ip);
        }
    }
}, 5 * 60 * 1000);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование всех запросов (для отладки)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Обслуживание статических файлов (безопасная настройка)
const staticDir = path.join(__dirname);
const HIDDEN_FILES = ['.gitignore', '.env', 'data copy.js', 'package.json', 'package-lock.json', 'railway.json', 'update-version.js', 'README.md', 'speech-proxy.js'];

app.use((req, res, next) => {
    const requestedFile = path.basename(req.path);
    if (HIDDEN_FILES.includes(requestedFile) || requestedFile.startsWith('.')) {
        return res.status(404).json({ error: 'Not found' });
    }
    next();
});

app.use(express.static(staticDir));

// Health check endpoint - всегда должен работать
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'speech-proxy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Info endpoint - минимальная информация без раскрытия секретов
app.get('/api/info', (req, res) => {
    res.json({
        service: 'Yarik.Uroki Speech Proxy',
        version: '2.4',
        endpoints: {
            tts: 'POST /api/tts',
            health: 'GET /health'
        }
    });
});

// Version endpoint для PWA update checking.
// Версия = время последнего изменения app.js. Меняется только при деплое,
// а не каждый день, поэтому баннер обновления появляется по делу.
app.get('/api/version', (req, res) => {
    fs.stat(path.join(__dirname, 'app.js'), (err, stats) => {
        const version = err ? 'unknown' : String(Math.floor(stats.mtimeMs));
        res.json({
            version: version,
            buildTime: new Date().toISOString()
        });
    });
});

// Допустимые значения параметров
const VALID_VOICES = ['alena', 'filipp', 'ermil'];
const VALID_EMOTIONS = ['good', 'evil', 'neutral'];
const MIN_SPEED = 0.1;
const MAX_SPEED = 3.0;
const MAX_TEXT_LENGTH = 500;

// Proxy endpoint for Yandex SpeechKit TTS (с rate limiting и валидацией)
app.post('/api/tts', rateLimit, async (req, res) => {
    const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();

    console.log(`[${requestId}] TTS request received`, {
        textLength: req.body.text?.length,
        voice: req.body.voice,
        ip: req.ip
    });

    try {
        // Извлекаем параметры с значениями по умолчанию
        const {
            text,
            voice = 'alena',
            emotion = 'good',
            speed = 1.0,
            format = 'oggopus',
            lang = 'ru-RU'
        } = req.body;

        // Валидация обязательных параметров
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            console.warn(`[${requestId}] Invalid text parameter`);
            return res.status(400).json({
                error: 'Text parameter is required and must be a non-empty string',
                requestId
            });
        }

        // Валидация длины текста
        if (text.length > MAX_TEXT_LENGTH) {
            return res.status(400).json({
                error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters`,
                requestId
            });
        }

        // Валидация voice
        if (voice && !VALID_VOICES.includes(voice)) {
            return res.status(400).json({
                error: `Invalid voice. Allowed: ${VALID_VOICES.join(', ')}`,
                requestId
            });
        }

        // Валидация emotion
        if (emotion && !VALID_EMOTIONS.includes(emotion)) {
            return res.status(400).json({
                error: `Invalid emotion. Allowed: ${VALID_EMOTIONS.join(', ')}`,
                requestId
            });
        }

        // Валидация speed
        const numSpeed = parseFloat(speed);
        if (isNaN(numSpeed) || numSpeed < MIN_SPEED || numSpeed > MAX_SPEED) {
            return res.status(400).json({
                error: `Invalid speed. Must be between ${MIN_SPEED} and ${MAX_SPEED}`,
                requestId
            });
        }

        // Проверка API ключа
        const apiKey = process.env.YANDEX_SPEECH_API_KEY;
        if (!apiKey) {
            console.error(`[${requestId}] Yandex API key not configured`);
            return res.status(500).json({
                error: 'Yandex SpeechKit API key is not configured on server',
                requestId,
                fix: 'Set YANDEX_SPEECH_API_KEY environment variable in Railway'
            });
        }

        // Подготовка запроса к Yandex SpeechKit
        const params = new URLSearchParams();
        params.append('text', text);
        params.append('lang', lang);
        params.append('voice', voice);
        params.append('emotion', emotion);
        params.append('speed', String(speed));
        params.append('format', format);

        // Добавляем folderId если есть
        const folderId = process.env.YANDEX_SPEECH_FOLDER_ID;
        if (folderId) {
            params.append('folderId', folderId);
        }

        // Настройка качества аудио
        if (process.env.YANDEX_SPEECH_QUALITY === 'hi') {
            params.append('sampleRateHertz', '48000');
        } else {
            params.append('sampleRateHertz', '16000'); // Стандартное качество
        }

        console.log(`[${requestId}] Calling Yandex API...`, {
            textPreview: text.length > 50 ? text.substring(0, 50) + '...' : text,
            voice,
            paramsCount: Array.from(params.entries()).length
        });

        // Запрос к Yandex SpeechKit с таймаутом
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

        const yandexResponse = await fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Yarik-Uroki-Speech-Proxy/2.0'
            },
            body: params.toString(),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;
        console.log(`[${requestId}] Yandex response received`, {
            status: yandexResponse.status,
            ok: yandexResponse.ok,
            responseTime: `${responseTime}ms`
        });

        // Обработка ошибок от Yandex
        if (!yandexResponse.ok) {
            let errorText = 'Unknown error';
            try {
                errorText = await yandexResponse.text();
                console.error(`[${requestId}] Yandex API error:`, yandexResponse.status, errorText);
            } catch (e) {
                console.error(`[${requestId}] Failed to read error text:`, e.message);
            }

            // Определяем подходящий HTTP статус для клиента
            let clientStatus = 502; // Bad Gateway по умолчанию
            if (yandexResponse.status === 401 || yandexResponse.status === 403) {
                clientStatus = 500; // Internal Server Error для проблем с аутентификацией
            } else if (yandexResponse.status === 429) {
                clientStatus = 429; // Too Many Requests
            } else if (yandexResponse.status >= 400 && yandexResponse.status < 500) {
                clientStatus = yandexResponse.status;
            }

            return res.status(clientStatus).json({
                error: 'Yandex SpeechKit error',
                status: yandexResponse.status,
                message: errorText.substring(0, 500),
                requestId,
                responseTime
            });
        }

        // Получение аудио данных
        const audioBuffer = await yandexResponse.buffer();
        const contentType = yandexResponse.headers.get('content-type') || 'audio/ogg';

        console.log(`[${requestId}] Audio received successfully`, {
            size: `${(audioBuffer.length / 1024).toFixed(2)} KB`,
            contentType,
            totalTime: `${Date.now() - startTime}ms`
        });

        // Отправка аудио с правильными заголовками
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Кэширование на 1 час
        res.setHeader('X-Request-ID', requestId);
        res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);

        res.send(audioBuffer);

    } catch (error) {
        const errorTime = Date.now() - startTime;
        console.error(`[${requestId}] Proxy error:`, {
            error: error.message,
            stack: error.stack,
            time: `${errorTime}ms`
        });

        // Определяем тип ошибки
        let statusCode = 500;
        let errorMessage = 'Internal server error';

        if (error.name === 'AbortError') {
            statusCode = 504; // Gateway Timeout
            errorMessage = 'Request to Yandex API timed out';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
            statusCode = 502; // Bad Gateway
            errorMessage = 'Network error connecting to Yandex API';
        }

        res.status(statusCode).json({
            error: errorMessage,
            message: error.message,
            requestId,
            responseTime: errorTime
        });
    }
});

// Обработка 404 для API маршрутов
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        availableEndpoints: ['POST /api/tts', 'GET /api/info']
    });
});

// SPA fallback - отдаем index.html для всех остальных маршрутов
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка необработанных ошибок
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`
===========================================
🚀 Speech Proxy Server v2.4
===========================================
✅ Server running on port: ${PORT}
✅ Health check: http://localhost:${PORT}/health
✅ TTS endpoint: POST http://localhost:${PORT}/api/tts
✅ Static files served from: ${__dirname}
✅ CORS restricted to allowed origins
✅ Rate limiting: ${RATE_LIMIT_MAX} req/min
===========================================
    `);
});