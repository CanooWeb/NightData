const FOUNDERS = ['Can2201'];

const DEFAULTS = {
  site_title: 'NightData',
  welcome_text: '',
  feed_enabled: '1',
  highlights_enabled: '1',
  allow_registration: '1',
  max_image_mb: '10',
  ann_duration_default: '60',
};

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
      const settings = await getSettings(env);

      if (url.pathname === '/api/register' && request.method === 'POST') {
        return await handleRegister(request, env, corsHeaders, settings);
      }
      if (url.pathname === '/api/login' && request.method === 'POST') {
        return await handleLogin(request, env, corsHeaders);
      }
      if (url.pathname === '/api/me' && request.method === 'GET') {
        return await handleMe(request, env, corsHeaders);
      }
      if (url.pathname === '/api/feed' && request.method === 'GET') {
        return await handleFeed(request, env, corsHeaders, settings);
      }
      if (url.pathname === '/api/posts' && request.method === 'POST') {
        return await handleCreatePost(request, env, corsHeaders, settings);
      }
      if (url.pathname === '/api/presign' && request.method === 'POST') {
        return await handlePresign(request, env, corsHeaders);
      }
      if (url.pathname === '/api/console-alert' && request.method === 'POST') {
        return await handleConsoleAlert(request, env, corsHeaders);
      }
      if (url.pathname === '/api/tickets' && request.method === 'POST') {
        return await handleCreateTicket(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/tickets/close' && request.method === 'POST') {
        return await handleAdminTicketClose(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/tickets/delete' && request.method === 'POST') {
        return await handleAdminTicketDelete(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/overview' && request.method === 'GET') {
        return await handleAdminOverview(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/users' && request.method === 'GET') {
        return await handleAdminUsers(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/users/role' && request.method === 'POST') {
        return await handleAdminUserRole(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/users/ban' && request.method === 'POST') {
        return await handleAdminUserBan(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/users/delete' && request.method === 'POST') {
        return await handleAdminUserDelete(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/posts' && request.method === 'GET') {
        return await handleAdminPosts(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/posts/update' && request.method === 'POST') {
        return await handleAdminPostUpdate(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/posts/delete' && request.method === 'POST') {
        return await handleAdminPostDelete(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/security' && request.method === 'GET') {
        return await handleAdminSecurity(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/settings' && request.method === 'GET') {
        return await handleAdminSettingsGet(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/settings' && request.method === 'POST') {
        return await handleAdminSettingsSet(request, env, corsHeaders);
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
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'`).run().catch(() => {});
  await env.DB.prepare(`ALTER TABLE users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0`).run().catch(() => {});
  await env.DB.prepare(`ALTER TABLE posts ADD COLUMN expires_at TEXT`).run().catch(() => {});
  await env.DB.prepare(`ALTER TABLE security_logs ADD COLUMN ipv4 TEXT`).run().catch(() => {});
  await env.DB.prepare(`ALTER TABLE security_logs ADD COLUMN ipv6 TEXT`).run().catch(() => {});
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS discord_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      discord_name TEXT NOT NULL,
      discord_id TEXT DEFAULT '',
      info TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now'))
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

async function getSettings(env) {
  const rows = (await env.DB.prepare('SELECT key, value FROM settings').all()).results;
  const map = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

async function setSettings(env, updates) {
  for (const [key, value] of Object.entries(updates)) {
    if (!(key in DEFAULTS)) continue;
    await env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(key, String(value)).run();
  }
}

async function getAuthUser(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;

  const session = await env.DB.prepare('SELECT * FROM sessions WHERE token = ?').bind(token).first();
  if (!session) return null;

  const user = await env.DB.prepare('SELECT id, username, role, banned FROM users WHERE id = ?').bind(session.user_id).first();
  if (!user || user.banned) return null;

  return user;
}

async function isFounder(request, env) {
  const user = await getAuthUser(request, env);
  return user && user.role === 'founder' ? user : null;
}

async function handleRegister(request, env, corsHeaders, settings) {
  let body = {};
  try {
    body = await request.json();
  } catch (err) {}

  if (settings.allow_registration !== '1') {
    return json({ error: 'Registrierung ist derzeit deaktiviert.' }, 403, corsHeaders);
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
  if (!user) {
    return json({ error: 'Benutzername oder Passwort ist falsch.' }, 401, corsHeaders);
  }
  if (user.banned) {
    return json({ error: 'Konto gesperrt.' }, 403, corsHeaders);
  }
  if (!(await verifyPassword(password, user.password))) {
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
  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!token) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  const session = await env.DB.prepare('SELECT * FROM sessions WHERE token = ?').bind(token).first();
  if (!session) return json({ error: 'Sitzung ungültig oder abgelaufen.' }, 401, corsHeaders);

  const user = await env.DB.prepare('SELECT id, username, role, banned FROM users WHERE id = ?').bind(session.user_id).first();
  if (!user) return json({ error: 'Benutzer nicht gefunden.' }, 401, corsHeaders);
  if (user.banned) return json({ error: 'Konto gesperrt.' }, 403, corsHeaders);

  return json({ success: true, user }, 200, corsHeaders);
}

async function handleFeed(request, env, corsHeaders, settings) {
  const me = await getAuthUser(request, env);

  const announcements = (await env.DB.prepare(
    "SELECT id, title, body, author, file_key, created_at FROM posts WHERE kind = 'announcement' AND (expires_at IS NULL OR julianday(expires_at) > julianday('now')) ORDER BY id DESC LIMIT 10"
  ).all()).results;
  const highlights = (await env.DB.prepare(
    "SELECT id, title, body, author, file_key, created_at FROM posts WHERE kind = 'highlight' ORDER BY id DESC LIMIT 10"
  ).all()).results;
  const submissions = (await env.DB.prepare(
    "SELECT id, title, body, author, file_key, created_at FROM posts WHERE kind = 'submission' ORDER BY id DESC LIMIT 50"
  ).all()).results;
  const tickets = (await env.DB.prepare(
    'SELECT id, author, discord_name, discord_id, info, status, created_at FROM discord_tickets ORDER BY id DESC LIMIT 100'
  ).all()).results;

  return json({
    announcements,
    highlights,
    submissions,
    tickets,
    me,
    config: {
      siteTitle: settings.site_title,
      welcomeText: settings.welcome_text,
      feedEnabled: settings.feed_enabled === '1',
      highlightsEnabled: settings.highlights_enabled === '1',
      maxImageMb: Number(settings.max_image_mb) || 10,
    },
  }, 200, corsHeaders);
}

async function handleCreatePost(request, env, corsHeaders, settings) {
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
  const duration = Number(body.duration) || 0;

  if (kind !== 'announcement' && kind !== 'highlight' && kind !== 'submission') {
    return json({ error: 'Ungültige Beitragsart.' }, 400, corsHeaders);
  }
  if (!title) {
    return json({ error: 'Ein Titel ist erforderlich.' }, 400, corsHeaders);
  }
  if (!text && !fileKey) {
    return json({ error: 'Bitte Text oder eine Datei hinzufügen.' }, 400, corsHeaders);
  }
  if (kind === 'announcement' && (duration < 0 || duration > 604800)) {
    return json({ error: 'Ungültige Dauer.' }, 400, corsHeaders);
  }
  if (kind === 'highlight' && settings.highlights_enabled !== '1') {
    return json({ error: 'Highlights sind deaktiviert.' }, 403, corsHeaders);
  }
  if (kind === 'submission' && settings.feed_enabled !== '1') {
    return json({ error: 'Einsendungen sind derzeit deaktiviert.' }, 403, corsHeaders);
  }

  if ((kind === 'announcement' || kind === 'highlight') && user.role !== 'founder') {
    return json({ error: 'Nur der Founder/Admin darf das erstellen.' }, 403, corsHeaders);
  }

  let expireSql = 'NULL';
  if (kind === 'announcement' && duration > 0) {
    expireSql = `datetime('now', '+${Math.floor(duration)} seconds')`;
  }

  const result = await env.DB.prepare(
    `INSERT INTO posts (kind, title, body, author, file_key, expires_at) VALUES (?, ?, ?, ?, ?, ${expireSql})`
  ).bind(kind, title, text, user.username, fileKey).run();

  const post = await env.DB.prepare(
    'SELECT id, kind, title, body, author, file_key, created_at, expires_at FROM posts WHERE id = ?'
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
  const ipv4 = String(body.ipv4 || body.clientIpv4 || '').slice(0, 45);
  const ipv6 = String(body.ipv6 || body.clientIpv6 || '').slice(0, 45);

  await env.DB.prepare(
    'INSERT INTO security_logs (username, ip, ua, action, ipv4, ipv6) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(me ? me.username : 'nicht angemeldet', ip, ua.slice(0, 300), action, ipv4 || null, ipv6 || null).run();

  return json({ success: true }, 200, corsHeaders);
}

async function handleCreateTicket(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) {
    return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  }

  let body = {};
  try {
    body = await request.json();
  } catch (err) {}

  const discordName = String(body.discordName || '').trim();
  const discordId = String(body.discordId || '').trim();
  const info = String(body.info || '').trim();

  if (!discordName) {
    return json({ error: 'Bitte den Discord-Namen angeben.' }, 400, corsHeaders);
  }
  if (discordName.length > 64 || discordId.length > 64 || info.length > 2000) {
    return json({ error: 'Eingaben sind zu lang.' }, 400, corsHeaders);
  }

  const result = await env.DB.prepare(
    'INSERT INTO discord_tickets (author, discord_name, discord_id, info) VALUES (?, ?, ?, ?)'
  ).bind(user.username, discordName, discordId, info).run();

  const ticket = await env.DB.prepare(
    'SELECT id, author, discord_name, discord_id, info, status, created_at FROM discord_tickets WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return json({ success: true, ticket }, 201, corsHeaders);
}

async function handleAdminTicketClose(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  const status = body.status === 'closed' ? 'closed' : 'open';
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  await env.DB.prepare('UPDATE discord_tickets SET status = ? WHERE id = ?').bind(status, id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminTicketDelete(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  await env.DB.prepare('DELETE FROM discord_tickets WHERE id = ?').bind(id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminOverview(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const userCount = (await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first()).n;
  const announcements = (await env.DB.prepare("SELECT COUNT(*) AS n FROM posts WHERE kind = 'announcement'").first()).n;
  const highlights = (await env.DB.prepare("SELECT COUNT(*) AS n FROM posts WHERE kind = 'highlight'").first()).n;
  const submissions = (await env.DB.prepare("SELECT COUNT(*) AS n FROM posts WHERE kind = 'submission'").first()).n;
  const security = (await env.DB.prepare('SELECT COUNT(*) AS n FROM security_logs').first()).n;
  const sessions = (await env.DB.prepare('SELECT COUNT(*) AS n FROM sessions').first()).n;
  const tickets = (await env.DB.prepare('SELECT COUNT(*) AS n FROM discord_tickets').first()).n;

  return json({ overview: { users: userCount, announcements, highlights, submissions, security, sessions, tickets } }, 200, corsHeaders);
}

async function handleAdminUsers(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const users = (await env.DB.prepare(
    'SELECT id, username, role, banned, created_at FROM users ORDER BY id' 
  ).all()).results;

  return json({ users }, 200, corsHeaders);
}

async function handleAdminUserRole(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  const role = ['founder', 'moderator', 'member'].includes(body.role) ? body.role : 'member';

  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  const target = await env.DB.prepare('SELECT id, role FROM users WHERE id = ?').bind(id).first();
  if (!target) return json({ error: 'Benutzer nicht gefunden.' }, 404, corsHeaders);
  if (target.id === founder.id && role !== 'founder') {
    return json({ error: 'Du kannst deine eigene Rolle nicht ändern.' }, 400, corsHeaders);
  }

  await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminUserBan(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  const banned = body.banned ? 1 : 0;

  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  await env.DB.prepare('UPDATE users SET banned = ? WHERE id = ?').bind(banned, id).run();
  if (banned) {
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  }
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminUserDelete(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ?').bind(id).first();
  if (!user) return json({ error: 'Benutzer nicht gefunden.' }, 404, corsHeaders);
  if (user.id === founder.id) return json({ error: 'Du kannst dich nicht selbst löschen.' }, 400, corsHeaders);

  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
  await env.DB.prepare('DELETE FROM posts WHERE author = ?').bind(user.username).run();
  await env.DB.prepare('DELETE FROM discord_tickets WHERE author = ?').bind(user.username).run();
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminPosts(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const posts = (await env.DB.prepare(
    'SELECT id, kind, title, author, file_key, created_at, expires_at FROM posts ORDER BY id DESC LIMIT 200'
  ).all()).results;

  return json({ posts }, 200, corsHeaders);
}

async function handleAdminPostUpdate(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  const kind = body.kind;

  if (!id || !kind) return json({ error: 'Ungültige Anfrage.' }, 400, corsHeaders);
  if (!['announcement', 'highlight', 'submission'].includes(kind)) {
    return json({ error: 'Ungültige Art.' }, 400, corsHeaders);
  }

  await env.DB.prepare('UPDATE posts SET kind = ? WHERE id = ?').bind(kind, id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminPostDelete(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminSecurity(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const logs = (await env.DB.prepare(
    'SELECT id, username, ip, ua, action, ipv4, ipv6, created_at FROM security_logs ORDER BY id DESC LIMIT 100'
  ).all()).results;

  return json({ logs }, 200, corsHeaders);
}

async function handleAdminSettingsGet(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const settings = await getSettings(env);
  return json({ settings }, 200, corsHeaders);
}

async function handleAdminSettingsSet(request, env, corsHeaders) {
  const founder = await isFounder(request, env);
  if (!founder) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const updates = body.settings || {};

  await setSettings(env, updates);
  const settings = await getSettings(env);
  return json({ success: true, settings }, 200, corsHeaders);
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