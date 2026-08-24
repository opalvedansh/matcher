const db = require('./src/config/db');
(async () => {
  try {
    const { rows } = await db.query("SELECT * FROM users LIMIT 1");
    console.log("Users:", rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
})();
