const { ApifyClient } = require('apify-client');
const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function run() {
  console.log("Starting apify search...");
  const startTime = Date.now();
  const run = await client.actor('apify/instagram-search-scraper').call({
    search: "suki",
    searchType: "user",
    resultsType: "details",
    searchLimit: 5
  }, { waitSecs: 60 });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  console.log("Time taken:", (Date.now() - startTime) / 1000, "seconds");
  console.log("Results:", items.map(i => i.username));
}
run().catch(console.error);
