const fetch = require('node-fetch');
async function test() {
  const rapidApiKey = '23760859c8msh6584e02c13968d2p1e15fajsne8fd1b0c01cf';
  const response = await fetch(`https://instagram-statistics-api.p.rapidapi.com/search?q=suki&perPage=6`, {
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
    }
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
