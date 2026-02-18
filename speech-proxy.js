// speech-proxy.js - Комбинированный сервер для Railway
// 1. Обслуживает статические файлы приложения
// 2. Прокси для Yandex SpeechKit

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

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'speech-proxy', timestamp: new Date().toISOString() });
});

// Proxy endpoint for Yandex SpeechKit TTS
app.post('/api/tts', async (req, res) => {
    try {
        const { text, voice = 'alena', emotion = 'good', speed = 1.0, format = 'oggopus', lang = 'ru-RU' } = req.body;

        // Validate required parameters
        if (!text) {
            return res.status(400).json({ error: 'Text parameter is required' });
        }

        const apiKey = process.env.YANDEX_SPEECH_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Yandex SpeechKit API key is not configured on server' });
        }

        // Prepare request to Yandex SpeechKit
        const params = new URLSearchParams();
        params.append('text', text);
        params.append('lang', lang);
        params.append('voice', voice);
        params.append('emotion', emotion);
        params.append('speed', String(speed));
        params.append('format', format);

        if (process.env.YANDEX_SPEECH_FOLDER_ID) {
            params.append('folderId', process.env.YANDEX_SPEECH_FOLDER_ID);
        }

        if (process.env.YANDEX_SPEECH_QUALITY === 'hi') {
            params.append('sampleRateHertz', '48000');
        } else {
            params.append('sampleRateHertz', '16000');
        }

        // Make request to Yandex SpeechKit
        const response = await fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Yarik-Uroki-Speech-Proxy/1.0'
            },
            body: params,
            timeout: 15000
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Yandex SpeechKit error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Yandex SpeechKit error',
                status: response.status,
                details: errorText
            });
        }

        // Get audio data
        const audioBuffer = await response.buffer();
        const contentType = response.headers.get('content-type') || 'audio/ogg';

        // Return audio with appropriate headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(audioBuffer);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        service: 'Yandex SpeechKit Proxy + Static Server',
        version: '1.0.0',
        endpoints: {
            tts: 'POST /api/tts',
            health: 'GET /health',
            info: 'GET /api/info',
            main: 'GET / (index.html)'
        },
        configured: !!process.env.YANDEX_SPEECH_API_KEY,
        hasFolderId: !!process.env.YANDEX_SPEECH_FOLDER_ID,
        staticFiles: ['index.html', 'app.js', 'config.js', 'speech-service.js', 'data.js', 'styles.css']
    });
});

// Маршрут для главной страницы (fallback для SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Combined server running on port ${PORT}`);
    console.log(`Static files served from: ${__dirname}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Main page: http://localhost:${PORT}/`);
    console.log(`Yandex API key configured: ${process.env.YANDEX_SPEECH_API_KEY ? 'Yes' : 'No'}`);
});

module.exports = app;