require('dotenv').config();
const express = require('express');
const cors = require('cors');
const winston = require('winston');
const path = require('path');
const { exec } = require('child_process');

const app = express();

// Initialize logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(__dirname, 'logs', 'server.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 3
        })
    ]
});

// Log server startup
logger.info({ message: '🚀 Starting server...' });

// Validate environment variables
const PORT = process.env.PORT || 5000;
const FRONTEND_URLS = process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map(s => s.trim())
    : ['http://localhost:5173'];
const ALLOWED_SITES = process.env.ALLOWED_SITES
    ? process.env.ALLOWED_SITES.split(',').map(s => s.trim())
    : [];

if (!process.env.FRONTEND_URLS) {
    logger.warn({ message: '⚠️ FRONTEND_URLS not set in .env. Defaulting to http://localhost:5173' });
}
if (ALLOWED_SITES.length === 0) {
    logger.error({ message: '❌ ALLOWED_SITES must be defined in .env' });
    process.exit(1);
}

// Middleware
app.use(cors({
    origin: FRONTEND_URLS,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    logger.info({
        message: 'Incoming request',
        method: req.method,
        url: req.originalUrl,
        body: req.method === 'POST' ? req.body : undefined
    });
    next();
});

// Base Routes
app.get('/', (req, res) => {
    res.json({ message: '🛍️ Ecom Scraper API' });
});

app.get('/cors-test', (req, res) => {
    res.json({ message: 'CORS is working', origin: req.get('origin') });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// Scraper Route
app.post('/api/scrape', (req, res) => {
    const { keyword, pageCount, retries, fields, site } = req.body;

    // Validate site
    if (!ALLOWED_SITES.includes(site)) {
        return res.status(400).json({ error: 'Site not allowed' });
    }

    const command = `python ./scrapers/${site}.py "${keyword}" ${pageCount} ${retries} "${fields}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error({ message: '❌ Scraper execution error', error: error.message });
            return res.status(500).json({ error: 'Scraper execution failed' });
        }

        if (stderr) {
            logger.warn({ message: '⚠️ Scraper STDERR', stderr });
        }

        logger.info({ message: `✅ Scraper output received`, length: stdout.length });

        try {
            const result = JSON.parse(stdout);
            res.json(result);
        } catch (parseErr) {
            logger.error({ message: '❌ Failed to parse scraper output', error: parseErr.message });
            res.status(500).json({ error: 'Failed to parse scraper output' });
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error({
        message: 'Unhandled server error',
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl
    });
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    logger.info({ message: `✅ Server running at http://localhost:${PORT}` });
});
