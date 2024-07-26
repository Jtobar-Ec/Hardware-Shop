const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
  secret: 'your-secret-key', // Cambia esto a una clave secreta en producción
  resave: false,
  saveUninitialized: false
}));

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('./ferreteria.db', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        image TEXT,
        promotion REAL
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
  }
});

// Middleware para proteger rutas que requieren autenticación
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.status(403).json({ error: 'No autenticado' });
}

// Middleware para proteger rutas que requieren ser administrador
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: 'Acceso denegado' });
}

// Endpoint para autenticación
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (user) {
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (isMatch) {
          req.session.user = { id: user.id, username: user.username, isAdmin: user.isAdmin };
          res.json({ message: 'Inicio de sesión exitoso' });
        } else {
          res.status(401).json({ error: 'Credenciales incorrectas' });
        }
      });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  });
});

// Endpoint para cerrar sesión
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Sesión cerrada con éxito' });
    }
  });
});

// Verificar si el usuario está autenticado
app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ isAuthenticated: true, isAdmin: req.session.user.isAdmin });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Endpoint para obtener productos
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint para agregar un producto (solo administradores)
app.post('/api/products', isAdmin, (req, res) => {
  const { name, price, image } = req.body;
  db.run('INSERT INTO products (name, price, image) VALUES (?, ?, ?)', [name, price, image], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Producto agregado con éxito' });
  });
});

// Endpoint para eliminar un producto (solo administradores)
app.delete('/api/products/:id', isAdmin, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Producto eliminado con éxito' });
  });
});

// Endpoint para actualizar el precio de un producto (solo administradores)
app.patch('/api/products/:id', isAdmin, (req, res) => {
  const { id } = req.params;
  const { price } = req.body;
  db.run('UPDATE products SET price = ? WHERE id = ?', [price, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Precio actualizado exitosamente' });
  });
});

// Endpoint para finalizar la compra
app.post('/api/checkout', (req, res) => {
  const items = JSON.stringify(req.body.items);
  db.run('INSERT INTO orders (items) VALUES (?)', [items], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Compra finalizada con éxito' });
  });
});

// Ruta para servir admin.html
app.get('/admin', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/admin.html'));
});

// Ruta para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

// Ruta para servir tienda.html
app.get('/tienda', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/tienda.html'));
});

// Ruta para servir login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
