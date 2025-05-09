const { spawn } = require("child_process");

const searchKeyword = "Caterpillar";
const pageCount = 10;
const retries = 3;

const scrapers = [
  "amazon",
  "alibaba",
  "madeinchina",
  "flipkart",
  "ebay",
  "indiamart",
  "Dhgate"
];

const runScraper = (scriptName) => {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Starting ${scriptName}.py`);

    const process = spawn("python3", [
      `./scrapers/${scriptName}.py`,
      searchKeyword,
      pageCount,
      retries,
    ]);

    process.stdout.on("data", (data) => {
      console.log(`[${scriptName}] ${data}`);
    });

    process.stderr.on("data", (data) => {
      console.error(`[${scriptName} ERROR] ${data}`);
    });

    process.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} finished successfully\n`);
        resolve();
      } else {
        console.log(`❌ ${scriptName} exited with code ${code}\n`);
        reject(code);
      }
    });
  });
};

(async () => {
  for (const script of scrapers) {
    try {
      await runScraper(script);
    } catch (e) {
      console.error(`Error in ${script}:`, e);
    }
  }
})();
