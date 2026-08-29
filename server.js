const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new DatabaseSync(path.join(__dirname, 'users.db'));

const userCols = db.prepare("PRAGMA table_info(users)").all();
if (userCols.length > 0 && !userCols.some(c => c.name === 'username')) {
  db.exec('DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS users;');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const insertUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
const findUserByUsername = db.prepare('SELECT * FROM users WHERE username = ?');
const findUserById = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
const insertSession = db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)');
const findSession = db.prepare('SELECT * FROM sessions WHERE token = ?');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const calc = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calc, 'hex'));
}

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Bitte alle Felder ausfüllen.' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Der Benutzername muss mindestens 3 Zeichen haben.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Das Passwort muss mindestens 8 Zeichen haben.' });
  }
  if (findUserByUsername.get(username)) {
    return res.status(409).json({ error: 'Dieser Benutzername ist bereits vergeben.' });
  }

  try {
    const result = insertUser.run(username, hashPassword(password));
    const user = findUserById.get(result.lastInsertRowid);
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Registrierung fehlgeschlagen.' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Bitte Benutzername und Passwort eingeben.' });
  }

  const user = findUserByUsername.get(username);
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Benutzername oder Passwort ist falsch.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  insertSession.run(token, user.id);

  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username }
  });
});

app.get('/api/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  const session = findSession.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Sitzung ungültig oder abgelaufen.' });
  }

  const user = findUserById.get(session.user_id);
  if (!user) {
    return res.status(401).json({ error: 'Benutzer nicht gefunden.' });
  }

  res.json({ success: true, user });
});

app.listen(PORT, () => {
  console.log(`Server läuft: http://localhost:${PORT}`);
});