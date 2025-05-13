const { runScraper } = require('./utils/ScraperUtils');

exports.runScrapers = async (req, res) => {
  const { keyword, sites, pageCount = '1', retries = '3' } = req.body;

  // Validate inputs
  if (!keyword || !Array.isArray(sites) || sites.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing or invalid keyword or sites array',
    });
  }

  const ALLOWED_SITES = process.env.ALLOWED_SITES
    ? process.env.ALLOWED_SITES.split(',').map((s) => s.trim())
    : [];

  // Validate sites
  const invalidSites = sites.filter((site) => !ALLOWED_SITES.includes(site));
  if (invalidSites.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid sites: ${invalidSites.join(', ')}. Available sites: ${ALLOWED_SITES.join(', ')}`,
    });
  }

  // Validate numeric inputs
  const pageCountNum = parseInt(pageCount, 10);
  const retriesNum = parseInt(retries, 10);
  if (isNaN(pageCountNum) || pageCountNum < 1 || isNaN(retriesNum) || retriesNum < 1) {
    return res.status(400).json({
      status: 'error',
      message: 'pageCount and retries must be positive integers',
    });
  }

  try {
    // Run all scrapers concurrently
    const scraperPromises = sites.map((site) =>
      runScraper(site, keyword, pageCountNum, retriesNum)
        .then((result) => ({ site, status: 'success', ...result }))
        .catch((error) => ({ site, status: 'error', error: error.message }))
    );

    const results = await Promise.all(scraperPromises);

    // Format the results
    const formattedResults = {};
    results.forEach((result) => {
      formattedResults[result.site] = {
        status: result.status,
        ...(result.status === 'success'
          ? {
              file: result.file,
              products: result.products,
              output: result.output,
            }
          : { error: result.error }),
      };
    });

    res.json({
      status: 'success',
      results: formattedResults,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Unexpected error while scraping',
      error: err.message,
    });
  }
};