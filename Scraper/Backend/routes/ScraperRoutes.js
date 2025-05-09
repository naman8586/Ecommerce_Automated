const express = require("express");
const router = express.Router();
const { scrapeData } = require("../scrapers/Scraper");

router.post("/scrape", async (req, res) => {
  try {
    const { source, keyword } = req.body;
    if (!source || !keyword) {
      return res.status(400).json({ error: "Source and keyword are required." });
    }

    const products = await scrapeData(source, keyword);
    return res.json({ products });
  } catch (error) {
    console.error("Error in scraping:", error);
    return res.status(500).json({ error: "Failed to scrape data." });
  }
});

module.exports = router;
