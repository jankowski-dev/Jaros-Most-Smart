// speech-proxy.js - Упрощенный и надежный прокси-сервер для Yandex SpeechKit
// Версия 2.0 - с улучшенной обработкой ошибок и логированием

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование всех запросов (для отладки)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname)));

// Health check endpoint - всегда должен работать
app.get('/health', (req, res) => {
    const healthInfo = {
        status: 'ok',
        service: 'speech-proxy',
        timestamp: new Date().toISOString(),
        yandexConfigured: !!process.env.YANDEX_SPEECH_API_KEY,
        hasFolderId: !!process.env.YANDEX_SPEECH_FOLDER_ID,
        nodeVersion: process.version,
        uptime: process.uptime()
    };
    console.log('Health check:', healthInfo);
    res.json(healthInfo);
});

// Info endpoint для диагностики
app.get('/api/info', (req, res) => {
    res.json({
        service: 'Yandex SpeechKit Proxy',
        version: '2.0',
        endpoints: {
            tts: 'POST /api/tts',
            health: 'GET /health',
            info: 'GET /api/info'
        },
        environment: {
            yandexApiKey: process.env.YANDEX_SPEECH_API_KEY ? 'Configured' : 'Missing',
            folderId: process.env.YANDEX_SPEECH_FOLDER_ID ? 'Configured' : 'Missing',
            nodeEnv: process.env.NODE_ENV || 'development',
            port: PORT
        }
    });
});

// Version endpoint для PWA update checking
// Версия автоматически обновляется при каждом деплое (на основе даты)
app.get('/api/version', (req, res) => {
    const today = new Date();
    const version = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    res.json({
        version: version,
        buildTime: new Date().toISOString()
    });
});

// Proxy endpoint for Yandex SpeechKit TTS
app.post('/api/tts', async (req, res) => {
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
            responseTime: `${responseTime}ms`,
            headers: Object.fromEntries(yandexResponse.headers.entries())
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
🚀 Speech Proxy Server v2.0
===========================================
✅ Server running on port: ${PORT}
✅ Health check: http://localhost:${PORT}/health
✅ TTS endpoint: POST http://localhost:${PORT}/api/tts
✅ Static files served from: ${__dirname}
✅ Yandex API configured: ${process.env.YANDEX_SPEECH_API_KEY ? 'YES' : 'NO'}
✅ Folder ID configured: ${process.env.YANDEX_SPEECH_FOLDER_ID ? 'YES' : 'NO'}
===========================================
    `);
});