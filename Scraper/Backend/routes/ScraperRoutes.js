const express = require('express');
const { runScraper, validateCaptcha } = require('../utils/ScraperUtils');

const router = express.Router();

router.post('/scrape', async (req, res) => {
    const { site, keyword, pageCount, retries, fields } = req.body;
    
    if (!site || !keyword || !pageCount || !retries || !fields) {
        return res.status(400).json({ 
            message: 'Missing required parameters',
            details: { site, keyword, pageCount, retries, fields }
        });
    }

    try {
        const result = await runScraper(site, keyword, pageCount, retries, fields);
        if (result.status === 'captcha_required') {
            return res.status(200).json({
                message: 'CAPTCHA required',
                captcha: result.captcha,
                sessionId: `madeinchina_${Date.now()}`
            });
        }
        res.status(200).json({
            message: 'Scraping completed successfully',
            products: result.products
        });
    } catch (error) {
        console.error(`Scrape error: ${error.message}\nStack: ${error.stack}`);
        res.status(500).json({ 
            message: `Failed to scrape ${site}`,
            error: error.message
        });
    }
});

router.post('/captcha', async (req, res) => {
    const { site, captchaInput, sessionId } = req.body;
    
    if (!site || !captchaInput || !sessionId) {
        return res.status(400).json({ 
            message: 'Missing required parameters',
            details: { site, captchaInput, sessionId }
        });
    }

    try {
        const result = await validateCaptcha(site, captchaInput, sessionId);
        if (result.valid) {
            res.status(200).json({ message: 'CAPTCHA validated successfully' });
        } else {
            res.status(400).json({ message: result.message || 'Invalid CAPTCHA' });
        }
    } catch (error) {
        console.error(`CAPTCHA validation error: ${error.message}\nStack: ${error.stack}`);
        res.status(500).json({ 
            message: `Failed to validate CAPTCHA`,
            error: error.message
        });
    }
});

module.exports = router;