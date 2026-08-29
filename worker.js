export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

async function handleRegister(request, env, corsHeaders) {
  let body = {};
  try {
    body = await request.json();
  } catch (err) {
    /* leerer Body = alle Felder fehlen */
  }

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

  const hash = await hashPassword(password);
  const result = await env.DB.prepare('INSERT INTO users (username, password) VALUES (?, ?)').bind(username, hash).run();
  const user = await env.DB.prepare('SELECT id, username, created_at FROM users WHERE id = ?').bind(result.meta.last_row_id).first();

  return json({ success: true, user }, 201, corsHeaders);
}

async function handleLogin(request, env, corsHeaders) {
  let body = {};
  try {
    body = await request.json();
  } catch (err) {
    /* leerer Body */
  }

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
    user: { id: user.id, username: user.username },
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

  const user = await env.DB.prepare('SELECT id, username, created_at FROM users WHERE id = ?').bind(session.user_id).first();
  if (!user) {
    return json({ error: 'Benutzer nicht gefunden.' }, 401, corsHeaders);
  }

  return json({ success: true, user }, 200, corsHeaders);
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