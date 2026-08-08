const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'sujal9706',
  database: 'alumni_connect',
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error('❌ DB connection failed FULL ERROR 👉', err);
    return;
  }
  console.log('✅ DB connected successfully 🚀');
});

module.exports = db;