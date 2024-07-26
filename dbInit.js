const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./ferreteria.db', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          price REAL,
          image TEXT
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          items TEXT
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          isAdmin BOOLEAN
        )
      `);
      // Insertar un usuario administrador por defecto
      bcrypt.hash('admin', 10, (err, hashedPassword) => {
        if (err) throw err;
        db.run(`
          INSERT OR IGNORE INTO users (username, password, isAdmin) VALUES (?, ?, ?)
        `, ['admin', hashedPassword, true]);
      });
    });
  }
});
