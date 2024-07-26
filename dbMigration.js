const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./ferreteria.db', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    db.serialize(() => {
      // Agregar la columna isAdmin a la tabla users si no existe
      db.run('ALTER TABLE users ADD COLUMN isAdmin BOOLEAN', (err) => {
        if (err && err.code !== 'SQLITE_ERROR') {
          console.error('Error al agregar la columna isAdmin:', err.message);
        } else {
          console.log('Columna isAdmin agregada con éxito.');
        }
      });

      // Opcional: Puedes también establecer el valor por defecto para los usuarios existentes
      db.run('UPDATE users SET isAdmin = ? WHERE username = ?', [true, 'admin'], (err) => {
        if (err) {
          console.error('Error al actualizar el usuario admin:', err.message);
        } else {
          console.log('Usuario admin actualizado con éxito.');
        }
      });
    });
  }
});
