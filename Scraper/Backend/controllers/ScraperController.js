const path = require("path");
const { spawn } = require("child_process");

exports.runScrapers = async (req, res) => {
  const { keyword, sites } = req.body;

  if (!keyword || !Array.isArray(sites) || sites.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "Missing or invalid keyword or sites array",
    });
  }

  const results = {};

  const runScraper = (site) =>
    new Promise((resolve, reject) => {
      const safeSite = path.basename(site);
      const isJsScraper = safeSite.includes("puppeteer");

      const scraperPath = path.join(
        __dirname,
        "..",
        "scrapers",
        isJsScraper ? "js" : "python",
        `${safeSite}_scraper.${isJsScraper ? "js" : "py"}`
      );

      const process = spawn(isJsScraper ? "node" : "python", [scraperPath, keyword]);

      let output = "";
      let error = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        error += data.toString();
      });

      const timeout = setTimeout(() => {
        process.kill();
        reject({ site, error: "Scraper timed out after 30 seconds" });
      }, 30000);

      process.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          try {
            const parsed = JSON.parse(output);
            resolve({ site, result: parsed });
          } catch (err) {
            reject({ site, error: "Invalid JSON output" });
          }
        } else {
          reject({ site, error: error || `Failed with code ${code}` });
        }
      });
    });

  try {
    const scraperPromises = sites.map((site) => runScraper(site));
    const data = await Promise.allSettled(scraperPromises);

    data.forEach((item) => {
      if (item.status === "fulfilled") {
        results[item.value.site] = item.value.result;
      } else {
        results[item.reason.site] = { error: item.reason.error };
      }
    });

    res.json({
      status: "success",
      results,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Unexpected error while scraping",
      error: err.message,
    });
  }
};
