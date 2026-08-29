const FOUNDERS = ['Can2201'];

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      await ensureSchema(env);

      if (url.pathname === '/api/register' && request.method === 'POST') {
        return await handleRegister(request, env, corsHeaders);
      }
      if (url.pathname === '/api/login' && request.method === 'POST') {
        return await handleLogin(request, env, corsHeaders);
      }
      if (url.pathname === '/api/me' && request.method === 'GET') {
        return await handleMe(request, env, corsHeaders);
      }
      if (url.pathname === '/api/feed' && request.method === 'GET') {
        return await handleFeed(request, env, corsHeaders);
      }
      if (url.pathname === '/api/posts' && request.method === 'POST') {
        return await handleCreatePost(request, env, corsHeaders);
      }
      if (url.pathname === '/api/presign' && request.method === 'POST') {
        return await handlePresign(request, env, corsHeaders);
      }
      if (url.pathname === '/api/console-alert' && request.method === 'POST') {
        return await handleConsoleAlert(request, env, corsHeaders);
      }
      if (url.pathname === '/api/security-logs' && request.method === 'GET') {
        return await handleSecurityLogs(request, env, corsHeaders);
      }
      if (url.pathname === '/' && request.method === 'GET') {
        return json({ service: 'NightData API', status: 'online' }, 200, corsHeaders);
      }

      return json({ error: 'Nicht gefunden.' }, 404, corsHeaders);
    } catch (err) {
      return json({ error: 'Serverfehler.' }, 500, corsHeaders);
    }
  },
};

let initialized = false;

async function ensureSchema(env) {
  if (initialized) return;
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL,
      file_key TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS security_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      ip TEXT,
      ua TEXT,
      action TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'`).run().catch(() => {});
  initialized = true;
}

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

async function getAuthUser(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;

  const session = await env.DB.prepare('SELECT * FROM sessions WHERE token = ?').bind(token).first();
  if (!session) return null;

  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ?').bind(session.user_id).first();
  if (!user) return null;

  return user;
}

async function handleRegister(request, env, corsHeaders) {
  let body = {};
  try {
    body = await request.json();
  } catch (err) {}

  const username = (body.username || '').trim();
  const password = body.password || '';

  if (!username || !password) {
    return json({ error: 'Bitte alle Felder ausfüllen.' }, 400, corsHeaders);
  }
  if (username.length < 3) {
    return json({ error: 'Der Benutzername muss mindestens 3 Zeichen haben.' }, 400, corsHeaders);
  }
  if (password.length < 8) {
    return json({ error: 'Das Passwort muss mindestens 8 Zeichen haben.' }, 400, corsHeaders);
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (existing) {
    return json({ error: 'Dieser Benutzername ist bereits vergeben.' }, 409, corsHeaders);
  }

  const role = FOUNDERS.includes(username) ? 'founder' : 'member';
  const hash = await hashPassword(password);
  const result = await env.DB.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').bind(username, hash, role).run();
  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ?').bind(result.meta.last_row_id).first();

  return json({ success: true, user }, 201, corsHeaders);
}

async function handleLogin(request, env, corsHeaders) {
  let body = {};
  try {
    body = await request.json();
  } catch (err) {}

  const username = (body.username || '').trim();
  const password = body.password || '';

  if (!username || !password) {
    return json({ error: 'Bitte Benutzername und Passwort eingeben.' }, 400, corsHeaders);
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!user || !(await verifyPassword(password, user.password))) {
    return json({ error: 'Benutzername oder Passwort ist falsch.' }, 401, corsHeaders);
  }

  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').bind(token, user.id).run();

  return json({
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role || 'member' },
  }, 200, corsHeaders);
}

async function handleMe(request, env, corsHeaders) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();

  if (!token) {
    return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  }

  const session = await env.DB.prepare('SELECT * FROM sessions WHERE token = ?').bind(token).first();
  if (!session) {
    return json({ error: 'Sitzung ungültig oder abgelaufen.' }, 401, corsHeaders);
  }

  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ?').bind(session.user_id).first();
  if (!user) {
    return json({ error: 'Benutzer nicht gefunden.' }, 401, corsHeaders);
  }

  return json({ success: true, user }, 200, corsHeaders);
}

async function handleFeed(request, env, corsHeaders) {
  const me = await getAuthUser(request, env);

  const announcements = (await env.DB.prepare(
    "SELECT id, title, body, author, file_key, created_at FROM posts WHERE kind = 'announcement' ORDER BY id DESC LIMIT 10"
  ).all()).results;
  const highlights = (await env.DB.prepare(
    "SELECT id, title, body, author, file_key, created_at FROM posts WHERE kind = 'highlight' ORDER BY id DESC LIMIT 10"
  ).all()).results;
  const submissions = (await env.DB.prepare(
    "SELECT id, title, body, author, file_key, created_at FROM posts WHERE kind = 'submission' ORDER BY id DESC LIMIT 50"
  ).all()).results;

  return json({ announcements, highlights, submissions, me }, 200, corsHeaders);
}

async function handleCreatePost(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) {
    return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  }

  let body = {};
  try {
    body = await request.json();
  } catch (err) {}

  const kind = String(body.kind || '');
  const title = String(body.title || '').trim();
  const text = String(body.body || '').trim();
  const fileKey = typeof body.fileKey === 'string' ? body.fileKey : null;

  if (kind !== 'announcement' && kind !== 'highlight' && kind !== 'submission') {
    return json({ error: 'Ungültige Beitragsart.' }, 400, corsHeaders);
  }
  if (!title) {
    return json({ error: 'Ein Titel ist erforderlich.' }, 400, corsHeaders);
  }
  if (!text && !fileKey) {
    return json({ error: 'Bitte Text oder eine Datei hinzufügen.' }, 400, corsHeaders);
  }

  if ((kind === 'announcement' || kind === 'highlight') && user.role !== 'founder') {
    return json({ error: 'Nur der Founder/Admin darf das erstellen.' }, 403, corsHeaders);
  }

  const result = await env.DB.prepare(
    'INSERT INTO posts (kind, title, body, author, file_key) VALUES (?, ?, ?, ?, ?)'
  ).bind(kind, title, text, user.username, fileKey).run();

  const post = await env.DB.prepare(
    'SELECT id, kind, title, body, author, file_key, created_at FROM posts WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return json({ success: true, post }, 201, corsHeaders);
}

async function handlePresign(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) {
    return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  }

  const cloud = env.CLOUDINARY_CLOUD;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = 'nightdata';
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = await sha1Hex(toSign + apiSecret);

  return json({
    success: true,
    url: `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
    fields: { folder, timestamp, signature, api_key: apiKey },
  }, 200, corsHeaders);
}

async function handleConsoleAlert(request, env, corsHeaders) {
  const me = await getAuthUser(request, env);
  let body = {};
  try {
    body = await request.json();
  } catch (err) {}

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip') || 'unbekannt';
  const ua = request.headers.get('User-Agent') || '';
  const action = String(body.action || 'console-zugriff');

  await env.DB.prepare(
    'INSERT INTO security_logs (username, ip, ua, action) VALUES (?, ?, ?, ?)'
  ).bind(me ? me.username : 'nicht angemeldet', ip, ua.slice(0, 300), action).run();

  return json({ success: true }, 200, corsHeaders);
}

async function handleSecurityLogs(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user || user.role !== 'founder') {
    return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);
  }

  const logs = (await env.DB.prepare(
    'SELECT username, ip, action, created_at FROM security_logs ORDER BY id DESC LIMIT 50'
  ).all()).results;

  return json({ logs }, 200, corsHeaders);
}

async function sha1Hex(data) {
  const bytes = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(data));
  return toHex(bytes);
}

function contentTypeFor(key) {
  const ext = (key.match(/\.([a-zA-Z0-9]+)$/) || [])[1];
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    m4v: 'video/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', pdf: 'application/pdf',
    txt: 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
}

const PBKDF2_ITERATIONS = 100000;

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt);
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const salt = hexToBytes(saltHex);
  const bits = await deriveBits(password, salt);
  const calc = toHex(new Uint8Array(bits));
  return timingSafeEqualHex(calc, hashHex);
}

async function deriveBits(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
}

function toHex(bytes) {
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function timingSafeEqualHex(a, b) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}