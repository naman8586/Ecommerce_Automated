const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const runScraper = (site, keyword, pageCount, retries, fields) => {
    const scriptPath = path.join(__dirname, '..', 'scrapers', `${site}.py`);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
        throw new Error(`Scraper script not found for ${site}`);
    }
    
    const command = `python "${scriptPath}" "${keyword}" ${pageCount} ${retries} "${fields}"`;
    console.log(`Executing command: ${command}`);

    try {
        // Use maxBuffer option to handle larger outputs
        const output = execSync(command, { 
            encoding: 'utf8', 
            stdio: 'pipe',
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        console.log(`Scraper output received (length: ${output.length} chars)`);
        
        try {
            // Try to parse the output as JSON
            const result = JSON.parse(output);
            return result;
        } catch (parseError) {
            console.error(`Error parsing scraper output as JSON: ${parseError.message}`);
            console.error(`First 200 chars of output: ${output.substring(0, 200)}...`);
            throw new Error(`Failed to parse scraper output: ${parseError.message}`);
        }
    } catch (error) {
        const errorMessage = error.stderr || error.message || 'Unknown error';
        console.error(`Error running scraper for ${site}: ${errorMessage}`);
        
        // Check if this is CAPTCHA-related error
        if (errorMessage.includes('CAPTCHA detected')) {
            // Parse CAPTCHA information from error message
            const captchaTypeMatch = errorMessage.match(/CAPTCHA_TYPE: (\w+)/);
            const captchaUrlMatch = errorMessage.match(/CAPTCHA_URL: (.+?)(\n|$)/);
            
            return {
                status: 'captcha_required',
                captcha: {
                    type: captchaTypeMatch ? captchaTypeMatch[1] : 'unknown',
                    url: captchaUrlMatch ? captchaUrlMatch[1] : ''
                }
            };
        }
        
        throw new Error(`Python script failed: ${errorMessage}`);
    }
};

const validateCaptcha = (site, captchaInput, sessionId) => {
    const scriptPath = path.join(__dirname, '..', 'scrapers', `${site}_captcha.py`);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
        throw new Error(`Captcha validation script not found for ${site}`);
    }
    
    const command = `python "${scriptPath}" "${captchaInput}" "${sessionId}"`;
    console.log(`Executing captcha validation: ${command}`);

    try {
        const output = execSync(command, { 
            encoding: 'utf8', 
            stdio: 'pipe',
            maxBuffer: 1024 * 1024 * 2 // 2MB buffer
        });
        
        console.log(`Captcha validation output: ${output}`);
        return JSON.parse(output);
    } catch (error) {
        const errorMessage = error.stderr || error.message || 'Unknown error';
        console.error(`Error validating captcha for ${site}: ${errorMessage}`);
        throw new Error(`Captcha validation failed: ${errorMessage}`);
    }
};

module.exports = { runScraper, validateCaptcha };