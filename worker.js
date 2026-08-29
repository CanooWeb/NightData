const FOUNDERS = ['Can2201'];

const CHEST_COOLDOWN_MS = 86400000;

const COSMETIC_ITEMS = [
  { id: 'neon_blue',    cat: 'glow',  label: 'Neon Blau',        v: '#4da6ff', rarity: 'common' },
  { id: 'neon_cyan',    cat: 'glow',  label: 'Neon Cyan',        v: '#7ae0e0', rarity: 'common' },
  { id: 'neon_red',     cat: 'glow',  label: 'Neon Rot',         v: '#ff5252', rarity: 'rare' },
  { id: 'neon_green',   cat: 'glow',  label: 'Neon Grün',        v: '#7bd389', rarity: 'rare' },
  { id: 'neon_pink',    cat: 'glow',  label: 'Neon Pink',        v: '#ff4d6d', rarity: 'rare' },
  { id: 'neon_gold',    cat: 'glow',  label: 'Neon Gold',        v: '#ffd166', rarity: 'epic' },
  { id: 'neon_violet',  cat: 'glow',  label: 'Neon Violett',     v: '#8b3ff0', rarity: 'epic' },
  { id: 'polar_white',  cat: 'glow',  label: 'Eis-Weiß',         v: '#e8ecff', rarity: 'epic' },
  { id: 'silver_shine', cat: 'glow',  label: 'Silberglanz',      v: '#d8e2f0', rarity: 'epic', effect: 'silver' },
  { id: 'gold_shine',   cat: 'glow',  label: 'Goldglanz',        v: '#ffd166', rarity: 'epic', effect: 'gold' },
  { id: 'rainbow_glow', cat: 'glow',  label: 'Rainbow Glow',      v: '#ff4d6d', rarity: 'legendary', effect: 'rainbow' },
  { id: 'theme_violet', cat: 'color', label: 'Violette Kiste',   v: '#8b3ff0', rarity: 'common' },
  { id: 'theme_mint',   cat: 'color', label: 'Minz-Kiste',       v: '#7bd389', rarity: 'common' },
  { id: 'theme_ice',    cat: 'color', label: 'Eisblau-Kiste',    v: '#7ae0e0', rarity: 'rare' },
  { id: 'theme_sunset', cat: 'color', label: 'Sonnenuntergang',  v: '#ff4d6d', rarity: 'rare' },
  { id: 'theme_gold',   cat: 'color', label: 'Royal-Gold-Kiste', v: '#ffd166', rarity: 'epic' },
  { id: 'theme_ember',  cat: 'color', label: 'Glut-Kiste',       v: '#ff9e5e', rarity: 'legendary' }
];

const RARITY_WEIGHT = { common: 60, rare: 25, epic: 11, legendary: 4 };
const RARITY_LABEL = { common: 'Gewöhnlich', rare: 'Selten', epic: 'Episch', legendary: 'Legendär' };

function cosmeticById(id) {
  return COSMETIC_ITEMS.find(i => i.id === id) || null;
}

function dtToMs(sqlDt) {
  try {
    const t = Date.parse(String(sqlDt).replace(' ', 'T') + 'Z');
    return Number.isFinite(t) ? t : null;
  } catch (e) { return null; }
}

function rollCosmetic(pool) {
  let total = 0;
  const ws = pool.map(i => { const w = RARITY_WEIGHT[i.rarity] || 1; total += w; return w; });
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= ws[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

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
      if (url.pathname === '/api/profile' && request.method === 'GET') {
        return await handleProfileGet(request, env, corsHeaders);
      }
      if (url.pathname === '/api/profile' && request.method === 'POST') {
        return await handleProfileUpdate(request, env, corsHeaders);
      }
      if (url.pathname === '/api/chat' && request.method === 'GET') {
        return await handleChatGet(request, env, corsHeaders);
      }
      if (url.pathname === '/api/chat/messages' && request.method === 'GET') {
        return await handleChatNew(request, env, corsHeaders);
      }
      if (url.pathname === '/api/chat/send' && request.method === 'POST') {
        return await handleChatSend(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/chat/delete' && request.method === 'POST') {
        return await handleAdminChatDelete(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/chat/mute' && request.method === 'POST') {
        return await handleAdminChatMute(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/chat/unmute' && request.method === 'POST') {
        return await handleAdminChatUnmute(request, env, corsHeaders);
      }
      if (url.pathname === '/api/friends' && request.method === 'GET') {
        return await handleFriendsGet(request, env, corsHeaders);
      }
      if (url.pathname === '/api/friends/unread' && request.method === 'GET') {
        return await handleFriendsUnread(request, env, corsHeaders);
      }
      if (url.pathname === '/api/friends/request' && request.method === 'POST') {
        return await handleFriendRequest(request, env, corsHeaders);
      }
      if (url.pathname === '/api/friends/accept' && request.method === 'POST') {
        return await handleFriendAccept(request, env, corsHeaders);
      }
      if (url.pathname === '/api/friends/decline' && request.method === 'POST') {
        return await handleFriendDecline(request, env, corsHeaders);
      }
      if (url.pathname === '/api/friends/withdraw' && request.method === 'POST') {
        return await handleFriendWithdraw(request, env, corsHeaders);
      }
      if (url.pathname === '/api/friends/remove' && request.method === 'POST') {
        return await handleFriendRemove(request, env, corsHeaders);
      }
      if (url.pathname === '/api/dm/conversations' && request.method === 'GET') {
        return await handleDmConversations(request, env, corsHeaders);
      }
      if (url.pathname === '/api/dm/messages' && request.method === 'GET') {
        return await handleDmMessages(request, env, corsHeaders);
      }
      if (url.pathname === '/api/dm/unread' && request.method === 'GET') {
        return await handleDmUnread(request, env, corsHeaders);
      }
      if (url.pathname === '/api/dm/send' && request.method === 'POST') {
        return await handleDmSend(request, env, corsHeaders);
      }
      if (url.pathname === '/api/users/profile' && request.method === 'GET') {
        return await handleUserInfo(request, env, corsHeaders);
      }
      if (url.pathname === '/api/chest/status' && request.method === 'GET') {
        return await handleChestStatus(request, env, corsHeaders);
      }
      if (url.pathname === '/api/chest/open' && request.method === 'POST') {
        return await handleChestOpen(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/chest/grant' && request.method === 'POST') {
        return await handleAdminChestGrant(request, env, corsHeaders);
      }
      if (url.pathname === '/api/inventory/equip' && request.method === 'POST') {
        return await handleInventoryEquip(request, env, corsHeaders);
      }
      if (url.pathname === '/api/inventory/unequip' && request.method === 'POST') {
        return await handleInventoryUnequip(request, env, corsHeaders);
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
      if (url.pathname === '/api/admin/security/clear' && request.method === 'POST') {
        return await handleAdminSecurityClear(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/roles' && request.method === 'GET') {
        return await handleAdminRolesList(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/roles' && request.method === 'POST') {
        return await handleAdminRoleCreate(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/roles/update' && request.method === 'POST') {
        return await handleAdminRoleUpdate(request, env, corsHeaders);
      }
      if (url.pathname === '/api/admin/roles/delete' && request.method === 'POST') {
        return await handleAdminRoleDelete(request, env, corsHeaders);
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
  await env.DB.prepare(`ALTER TABLE users ADD COLUMN avatar TEXT`).run().catch(() => {});
  await env.DB.prepare(`ALTER TABLE users ADD COLUMN alias TEXT`).run().catch(() => {});
  await env.DB.prepare(`ALTER TABLE users ADD COLUMN bio TEXT`).run().catch(() => {});
  await env.DB.prepare(`ALTER TABLE users ADD COLUMN games TEXT`).run().catch(() => {});
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
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS custom_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#9a6fd8',
      builtin INTEGER NOT NULL DEFAULT 0
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS mutes (
      username TEXT PRIMARY KEY,
      until TEXT,
      muted_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(from_user, to_user)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_a TEXT NOT NULL,
      user_b TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_a, user_b)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS dm_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      recipient TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      item_id TEXT NOT NULL,
      obtained_at TEXT DEFAULT (datetime('now')),
      UNIQUE(username, item_id)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS chest_opens (
      username TEXT PRIMARY KEY,
      last_open_at TEXT
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS chest_credits (
      username TEXT PRIMARY KEY,
      credits INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare('ALTER TABLE users ADD COLUMN glow_item TEXT').run().catch(() => {});
  await env.DB.prepare('ALTER TABLE users ADD COLUMN color_item TEXT').run().catch(() => {});
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_fr_to ON friend_requests (to_user)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_dm_recip ON dm_messages (recipient, read)').run();
  const seedRoles = [
    ['founder', '#7ae0e0', 1],
    ['admin', '#ff5252', 1],
    ['moderator', '#ffd166', 1],
    ['member', '#9a6fd8', 1],
  ];
  for (const [name, color, builtin] of seedRoles) {
    await env.DB.prepare('INSERT OR IGNORE INTO custom_roles (name, color, builtin) VALUES (?, ?, ?)').bind(name, color, builtin).run();
  }
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

  const user = await env.DB.prepare('SELECT id, username, avatar, alias, bio, games, role, banned, glow_item, color_item FROM users WHERE id = ?').bind(session.user_id).first();
  if (!user || user.banned) return null;

  return user;
}

async function isFounder(request, env) {
  const user = await getAuthUser(request, env);
  return user && user.role === 'founder' ? user : null;
}

async function isAdmin(request, env) {
  const user = await getAuthUser(request, env);
  return user && (user.role === 'founder' || user.role === 'admin') ? user : null;
}

async function isStaff(request, env) {
  const user = await getAuthUser(request, env);
  return user && ['founder', 'admin', 'moderator'].includes(user.role) ? user : null;
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
  if (username.length > 24) {
    return json({ error: 'Der Benutzername darf maximal 24 Zeichen haben.' }, 400, corsHeaders);
  }
  if (!/^[\p{L}\p{N}_.\- ]+$/u.test(username)) {
    return json({ error: 'Der Benutzername darf nur Buchstaben, Zahlen, _ . - und Leerzeichen enthalten.' }, 400, corsHeaders);
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

  const user = await env.DB.prepare('SELECT id, username, avatar, alias, bio, games, role, banned FROM users WHERE id = ?').bind(session.user_id).first();
  if (!user) return json({ error: 'Benutzer nicht gefunden.' }, 401, corsHeaders);
  if (user.banned) return json({ error: 'Konto gesperrt.' }, 403, corsHeaders);

  const postsCount = (await env.DB.prepare('SELECT COUNT(*) AS n FROM posts WHERE author = ?').bind(user.username).first()).n;
  const ticketsCount = (await env.DB.prepare('SELECT COUNT(*) AS n FROM discord_tickets WHERE author = ?').bind(user.username).first()).n;

  return json({ success: true, user, postsCount, ticketsCount }, 200, corsHeaders);
}

async function handleProfileGet(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  const postsCount = (await env.DB.prepare('SELECT COUNT(*) AS n FROM posts WHERE author = ?').bind(user.username).first()).n;
  const ticketsCount = (await env.DB.prepare('SELECT COUNT(*) AS n FROM discord_tickets WHERE author = ?').bind(user.username).first()).n;

  return json({ success: true, user, postsCount, ticketsCount }, 200, corsHeaders);
}

async function handleProfileUpdate(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}

  let avatar = String(body.avatar || '').trim();
  let alias = String(body.alias || '').trim();
  const bio = String(body.bio || '').trim();
  let games = Array.isArray(body.games) ? body.games : String(body.games || '');
  if (Array.isArray(games)) games = games.map(g => String(g).trim().slice(0, 40)).filter(Boolean);
  else games = String(games).split('\n').map(g => g.trim()).filter(Boolean);
  games = Array.from(new Set(games)).slice(0, 8).join('\n');

  if (avatar && !/^https:\/\/\S+$/.test(avatar)) avatar = '';
  avatar = avatar.slice(0, 300);
  alias = alias.slice(0, 32);
  if (bio.length > 500) return json({ error: 'Bio darf maximal 500 Zeichen haben.' }, 400, corsHeaders);
  if (games.length > 500) return json({ error: 'Zu viele Games angegeben.' }, 400, corsHeaders);

  await env.DB.prepare('UPDATE users SET avatar = ?, alias = ?, bio = ?, games = ? WHERE id = ?')
    .bind(avatar || null, alias || null, bio || null, games || null, user.id).run();

  const updated = await env.DB.prepare('SELECT id, username, avatar, alias, bio, games, role, glow_item, color_item FROM users WHERE id = ?').bind(user.id).first();
  return json({ success: true, user: updated }, 200, corsHeaders);
}

const CHAT_JOIN =
  'SELECT m.id, m.author, m.message, m.created_at, u.avatar, u.alias, u.role, u.glow_item, u.color_item, mu.until AS muted_until FROM chat_messages m LEFT JOIN users u ON u.username = m.author LEFT JOIN mutes mu ON mu.username = m.author';

async function handleChatGet(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  await env.DB.prepare("DELETE FROM mutes WHERE until != 'PERM' AND until IS NOT NULL AND datetime(until) <= datetime('now')").run();
  const rows = (await env.DB.prepare(CHAT_JOIN + ' ORDER BY m.id DESC LIMIT 50').all()).results.reverse();
  return json({ messages: rows }, 200, corsHeaders);
}

async function handleChatNew(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  const after = Math.max(Number(new URL(request.url).searchParams.get('after')) || 0, 0);
  await env.DB.prepare("DELETE FROM mutes WHERE until != 'PERM' AND until IS NOT NULL AND datetime(until) <= datetime('now')").run();
  const messages = (await env.DB.prepare(CHAT_JOIN + ' WHERE m.id > ? ORDER BY m.id ASC LIMIT 100').bind(after).all()).results;
  return json({ messages }, 200, corsHeaders);
}

async function handleChatSend(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  const muted = await isMuted(user.username, env);
  if (muted) {
    const msg = muted.permanent
      ? 'Du bist im Live-Chat dauerhaft stummgeschaltet.'
      : 'Du bist im Live-Chat stummgeschaltet bis ' + fmtSqlDt(muted.until) + '.';
    return json({ error: msg }, 403, corsHeaders);
  }

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const message = String(body.message || '').trim().slice(0, 500);
  if (!message) return json({ error: 'Du kannst keine leere Nachricht senden.' }, 400, corsHeaders);

  const last = await env.DB.prepare('SELECT created_at FROM chat_messages WHERE author = ? ORDER BY id DESC LIMIT 1').bind(user.username).first();
  if (last) {
    try {
      const lastMs = Date.parse(String(last.created_at).replace(' ', 'T') + 'Z') || 0;
      if (lastMs && (Date.now() - lastMs) < 2000) {
        return json({ error: 'Bitte kurz warten, bevor du die nächste Nachricht sendest.' }, 429, corsHeaders);
      }
    } catch (e) {}
  }

  const result = await env.DB.prepare('INSERT INTO chat_messages (author, message) VALUES (?, ?)').bind(user.username, message).run();
  const msg = (await env.DB.prepare(CHAT_JOIN + ' WHERE m.id = ?').bind(result.meta.last_row_id).first());

  await env.DB.prepare('DELETE FROM chat_messages WHERE id < (SELECT COALESCE(MAX(id), 0) - 400 FROM chat_messages)').run();

  return json({ success: true, message: msg }, 201, corsHeaders);
}

function isStaffMember(user) {
  return user && ['founder', 'admin', 'moderator'].includes(user.role);
}

function fmtSqlDt(sqlDt) {
  try {
    return new Date(String(sqlDt).replace(' ', 'T') + 'Z').toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return String(sqlDt || ''); }
}

async function isMuted(username, env) {
  const row = await env.DB.prepare('SELECT until FROM mutes WHERE username = ?').bind(username).first();
  if (!row) return null;
  const u = row.until;
  if (u === 'PERM') return { permanent: true, until: null };
  const ms = Date.parse(String(u).replace(' ', 'T') + 'Z');
  if (!ms || ms <= Date.now()) {
    await env.DB.prepare('DELETE FROM mutes WHERE username = ?').bind(username).run();
    return null;
  }
  return { permanent: false, until: String(u) };
}

function isFounderRole(u) { return !!u && u.role === 'founder'; }
function isAdminRole(u) { return !!u && (u.role === 'founder' || u.role === 'admin'); }

function canModerate(targetUser, actor) {
  if (isFounderRole(actor)) return targetUser.role !== 'founder';
  if (targetUser.role === 'founder') return false;
  if (isAdminRole(actor)) return targetUser.role !== 'admin';
  return targetUser.role !== 'founder' && targetUser.role !== 'admin' && targetUser.role !== 'moderator';
}

async function handleAdminChatDelete(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  if (!isStaffMember(user)) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  if (!id) return json({ error: 'Keine Nachrichten-ID.' }, 400, corsHeaders);

  const msg = await env.DB.prepare(
    'SELECT m.author, u.role FROM chat_messages m LEFT JOIN users u ON u.username = m.author WHERE m.id = ?'
  ).bind(id).first();
  if (!msg) return json({ error: 'Nachricht nicht gefunden.' }, 404, corsHeaders);
  if (msg.author && msg.author !== user.username) {
    const targetUser = { role: msg.role || 'member' };
    if (!canModerate(targetUser, user)) {
      return json({ error: 'Keine Berechtigung, diese Nachricht zu löschen.' }, 403, corsHeaders);
    }
  }

  await env.DB.prepare('DELETE FROM chat_messages WHERE id = ?').bind(id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminChatMute(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  if (!isStaffMember(user)) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const author = String(body.author || '').trim();
  if (!author) return json({ error: 'Kein Benutzername.' }, 400, corsHeaders);

  const target = await env.DB.prepare('SELECT username, role FROM users WHERE username = ?').bind(author).first();
  if (!target) return json({ error: 'Benutzer nicht gefunden.' }, 404, corsHeaders);
  if (target.username === user.username) return json({ error: 'Du kannst dich nicht selbst stummschalten.' }, 400, corsHeaders);
  if (!canModerate(target, user)) return json({ error: 'Keine Berechtigung, diesen Benutzer stummzuschalten.' }, 403, corsHeaders);

  let duration = body.duration;
  let until;
  if (String(duration).trim() === '0' || String(duration).trim() === 'perm') {
    until = 'PERM';
  } else {
    const secs = Math.max(Number(duration) || 0, 0);
    if (secs <= 0) return json({ error: 'Ungültige Dauer.' }, 400, corsHeaders);
    const row = await env.DB.prepare("SELECT datetime('now', '+' || ? || ' seconds') AS t").bind(secs).first();
    until = row.t;
  }

  await env.DB.prepare('INSERT INTO mutes (username, until, muted_by) VALUES (?, ?, ?) ON CONFLICT(username) DO UPDATE SET until = excluded.until, muted_by = excluded.muted_by, created_at = datetime(\'now\')')
    .bind(author, until, user.username).run();

  return json({ success: true, mutes: await isMuted(author, env), until }, 200, corsHeaders);
}

async function handleAdminChatUnmute(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  if (!isStaffMember(user)) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const author = String(body.author || '').trim();
  if (!author) return json({ error: 'Kein Benutzername.' }, 400, corsHeaders);

  await env.DB.prepare('DELETE FROM mutes WHERE username = ?').bind(author).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleFriendsGet(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;

  const incoming = (await env.DB.prepare(
    'SELECT fr.id, fr.from_user AS username, fr.created_at, u.avatar, u.alias, u.role, u.glow_item, u.color_item FROM friend_requests fr JOIN users u ON u.username = fr.from_user WHERE fr.to_user = ? ORDER BY fr.id DESC'
  ).bind(me).all()).results;

  const outgoing = (await env.DB.prepare(
    'SELECT fr.id, fr.to_user AS username, fr.created_at, u.avatar, u.alias, u.role, u.glow_item, u.color_item FROM friend_requests fr JOIN users u ON u.username = fr.to_user WHERE fr.from_user = ? ORDER BY fr.id DESC'
  ).bind(me).all()).results;

  const friends = (await env.DB.prepare(
    "SELECT f.user_a, f.user_b, f.created_at, u.username, u.avatar, u.alias, u.role, u.glow_item, u.color_item FROM friends f JOIN users u ON u.username = CASE WHEN f.user_a = ? THEN f.user_b ELSE f.user_a END WHERE f.user_a = ? OR f.user_b = ? ORDER BY f.id DESC"
  ).bind(me, me, me).all()).results;

  return json({ friends, incoming, outgoing }, 200, corsHeaders);
}

async function handleFriendsUnread(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  const row = await env.DB.prepare(
    'SELECT id FROM friend_requests WHERE to_user = ? ORDER BY id DESC LIMIT 1'
  ).bind(user.username).first();
  const latest = row ? row.id : 0;
  const total = (await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM friend_requests WHERE to_user = ?'
  ).bind(user.username).first()).c || 0;

  return json({ total, latest_id: latest }, 200, corsHeaders);
}

async function handleFriendRequest(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const friend = String(body.username || '').trim();
  if (!friend) return json({ error: 'Kein Benutzername.' }, 400, corsHeaders);
  if (friend === me) return json({ error: 'Du kannst dich nicht selbst als Freund hinzufügen.' }, 400, corsHeaders);

  const target = await env.DB.prepare('SELECT username, role FROM users WHERE username = ?').bind(friend).first();
  if (!target) return json({ error: 'Benutzer nicht gefunden.' }, 404, corsHeaders);

  const already = await env.DB.prepare(
    'SELECT id FROM friends WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)'
  ).bind(me, friend, friend, me).first();
  if (already) return json({ error: friend + ' ist bereits dein Freund.' }, 400, corsHeaders);

  const pending = await env.DB.prepare(
    'SELECT id FROM friend_requests WHERE (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?)'
  ).bind(me, friend, friend, me).first();
  if (pending) return json({ error: 'Eine Anfrage ist bereits offen.' }, 400, corsHeaders);

  await env.DB.prepare('INSERT INTO friend_requests (from_user, to_user) VALUES (?, ?)').bind(me, friend).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleFriendAccept(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const from = String(body.from || '').trim();
  if (!from) return json({ error: 'Kein Benutzername.' }, 400, corsHeaders);

  const req = await env.DB.prepare('SELECT id FROM friend_requests WHERE from_user = ? AND to_user = ?').bind(from, me).first();
  if (!req) return json({ error: 'Keine offene Anfrage.' }, 404, corsHeaders);

  const a = from < me ? from : me;
  const b = from < me ? me : from;
  await env.DB.prepare('INSERT INTO friends (user_a, user_b) VALUES (?, ?) ON CONFLICT(user_a, user_b) DO NOTHING').bind(a, b).run();
  await env.DB.prepare('DELETE FROM friend_requests WHERE from_user = ? AND to_user = ?').bind(from, me).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleFriendDecline(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const from = String(body.from || '').trim();
  if (!from) return json({ error: 'Kein Benutzername.' }, 400, corsHeaders);

  await env.DB.prepare('DELETE FROM friend_requests WHERE from_user = ? AND to_user = ?').bind(from, me).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleFriendWithdraw(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const friend = String(body.username || '').trim();
  if (!friend) return json({ error: 'Kein Benutzername.' }, 400, corsHeaders);

  await env.DB.prepare('DELETE FROM friend_requests WHERE from_user = ? AND to_user = ?').bind(me, friend).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleFriendRemove(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const friend = String(body.username || '').trim();
  if (!friend) return json({ error: 'Kein Benutzername.' }, 400, corsHeaders);

  await env.DB.prepare('DELETE FROM friends WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)').bind(me, friend, friend, me).run();
  return json({ success: true }, 200, corsHeaders);
}

const DM_JOIN =
  'SELECT m.id, m.sender, m.recipient, m.message, m.read, m.created_at, us.avatar AS sender_avatar, us.alias AS sender_alias, us.role AS sender_role, us.glow_item AS sender_glow, us.color_item AS sender_theme, ut.avatar AS rec_avatar, ut.alias AS rec_alias, ut.role AS rec_role, ut.glow_item AS rec_glow, ut.color_item AS rec_theme FROM dm_messages m LEFT JOIN users us ON us.username = m.sender LEFT JOIN users ut ON ut.username = m.recipient';

async function peerUser(row, me) {
  return {
    username: row.sender === me ? row.recipient : row.sender,
    avatar: row.sender === me ? row.rec_avatar : row.sender_avatar,
    alias: row.sender === me ? row.rec_alias : row.sender_alias,
    role: row.sender === me ? row.rec_role : row.sender_role,
    glow: row.sender === me ? row.rec_glow : row.sender_glow,
    theme: row.sender === me ? row.rec_theme : row.sender_theme
  };
}

async function handleDmConversations(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;

  const friends = (await env.DB.prepare(
    "SELECT f.created_at, u.username FROM friends f JOIN users u ON u.username = CASE WHEN f.user_a = ? THEN f.user_b ELSE f.user_a END WHERE f.user_a = ? OR f.user_b = ?"
  ).bind(me, me, me).all()).results.map(r => r.username);

  const msgs = (await env.DB.prepare(DM_JOIN + ' WHERE m.sender = ? OR m.recipient = ? ORDER BY m.id DESC LIMIT 1000').bind(me, me).all()).results;

  const lastByPeer = {};
  const unreadByPeer = {};
  const myLastReadByPeer = {};
  for (const m of msgs) {
    const peer = m.sender === me ? m.recipient : m.sender;
    if (!(peer in lastByPeer)) lastByPeer[peer] = m;
    if (m.recipient === me && m.read === 0) unreadByPeer[peer] = (unreadByPeer[peer] || 0) + 1;
    if (m.sender === me && !(peer in myLastReadByPeer)) myLastReadByPeer[peer] = m.read === 1;
  }

  const convs = friends.map(name => {
    const last = lastByPeer[name];
    const info = last ? peerUser(last, me) : null;
    return {
      username: name,
      avatar: info ? info.avatar : null,
      alias: info ? info.alias : null,
      role: info ? info.role : null,
      glow: info ? info.glow : null,
      theme: info ? info.theme : null,
      last_message: last ? last.message : null,
      last_created: last ? last.created_at : null,
      last_sender: last ? last.sender : me,
      my_last_read: !!myLastReadByPeer[name],
      unread: unreadByPeer[name] || 0
    };
  });
  convs.sort((x, y) => String(y.last_created || '').localeCompare(String(x.last_created || '')));

  return json({ conversations: convs }, 200, corsHeaders);
}

async function handleDmUnread(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;

  const messages = (await env.DB.prepare(
    'SELECT m.id, m.sender, m.message, m.created_at, u.avatar, u.alias, u.role FROM dm_messages m LEFT JOIN users u ON u.username = m.sender WHERE m.recipient = ? AND m.read = 0 ORDER BY m.id DESC LIMIT 10'
  ).bind(me).all()).results;
  const total = (await env.DB.prepare('SELECT COUNT(*) AS c FROM dm_messages WHERE recipient = ? AND read = 0').bind(me).first()).c || 0;

  return json({ total, messages, latest_id: messages.length ? messages[0].id : 0 }, 200, corsHeaders);
}

async function isFriend(env, a, b) {
  const row = await env.DB.prepare('SELECT id FROM friends WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)').bind(a, b, b, a).first();
  return !!row;
}

async function handleDmMessages(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;
  const friend = String(new URL(request.url).searchParams.get('friend') || '').trim();
  if (!friend) return json({ error: 'Kein Freund angegeben.' }, 400, corsHeaders);
  if (!(await isFriend(env, me, friend))) return json({ error: 'Ihr seid keine Freunde.' }, 403, corsHeaders);

  const after = Math.max(Number(new URL(request.url).searchParams.get('after')) || 0, 0);
  const messages = (await env.DB.prepare(
    DM_JOIN + ' WHERE ((m.sender = ? AND m.recipient = ?) OR (m.sender = ? AND m.recipient = ?)) AND m.id > ? ORDER BY m.id ASC LIMIT 100'
  ).bind(me, friend, friend, me, after).all()).results;

  const contact = (await env.DB.prepare('SELECT username, avatar, alias, role, glow_item, color_item FROM users WHERE username = ?').bind(friend).first());
  if (contact) {
    await env.DB.prepare('UPDATE dm_messages SET read = 1 WHERE recipient = ? AND sender = ?').bind(me, friend).run();
  }

  return json({ messages, friend: contact }, 200, corsHeaders);
}

async function handleDmSend(request, env, corsHeaders) {
  const user = await getAuthUser(request, env);
  if (!user) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);
  const me = user.username;

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const to = String(body.to || '').trim();
  const message = String(body.message || '').trim().slice(0, 500);
  if (!to) return json({ error: 'Kein Empfänger.' }, 400, corsHeaders);
  if (!message) return json({ error: 'Du kannst keine leere Nachricht senden.' }, 400, corsHeaders);
  if (!(await isFriend(env, me, to))) return json({ error: 'Du kannst nur Freunden privat schreiben.' }, 403, corsHeaders);

  const last = await env.DB.prepare('SELECT created_at FROM dm_messages WHERE sender = ? ORDER BY id DESC LIMIT 1').bind(me).first();
  if (last) {
    try {
      const lastMs = Date.parse(String(last.created_at).replace(' ', 'T') + 'Z') || 0;
      if (lastMs && (Date.now() - lastMs) < 2000) {
        return json({ error: 'Bitte kurz warten, bevor du die nächste Nachricht sendest.' }, 429, corsHeaders);
      }
    } catch (e) {}
  }

  const result = await env.DB.prepare('INSERT INTO dm_messages (sender, recipient, message) VALUES (?, ?, ?)').bind(me, to, message).run();
  const msg = (await env.DB.prepare(DM_JOIN + ' WHERE m.id = ?').bind(result.meta.last_row_id).first());

  await env.DB.prepare('DELETE FROM dm_messages WHERE id < (SELECT COALESCE(MAX(id), 0) - 2000 FROM dm_messages)').run();

  return json({ success: true, message: msg }, 201, corsHeaders);
}

async function handleUserInfo(request, env, corsHeaders) {
  const me = await getAuthUser(request, env);
  if (!me) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  const username = String(new URL(request.url).searchParams.get('username') || '').trim();
  if (!username) return json({ error: 'Kein Benutzername.' }, 400, corsHeaders);

  const u = await env.DB.prepare('SELECT username, avatar, alias, bio, games, role, glow_item, color_item FROM users WHERE username = ?').bind(username).first();
  if (!u) return json({ error: 'Benutzer nicht gefunden.' }, 404, corsHeaders);

  const postsCount = (await env.DB.prepare("SELECT COUNT(*) AS c FROM posts WHERE author = ?").bind(username).first()).c || 0;
  const ticketsCount = (await env.DB.prepare("SELECT COUNT(*) AS c FROM discord_tickets WHERE author = ?").bind(username).first()).c || 0;

  const f = await env.DB.prepare('SELECT id FROM friends WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)').bind(me.username, username, username, me.username).first();
  let friendStatus = 'none';
  if (f) {
    friendStatus = 'friend';
  } else {
    const inc = await env.DB.prepare('SELECT id FROM friend_requests WHERE from_user = ? AND to_user = ?').bind(username, me.username).first();
    const out = await env.DB.prepare('SELECT id FROM friend_requests WHERE from_user = ? AND to_user = ?').bind(me.username, username).first();
    if (inc) friendStatus = 'incoming';
    else if (out) friendStatus = 'outgoing';
  }

  return json({
    user: { username: u.username, avatar: u.avatar, alias: u.alias, bio: u.bio || '', games: u.games || '', role: u.role, glow_item: u.glow_item, color_item: u.color_item },
    postsCount, ticketsCount, friendStatus
  }, 200, corsHeaders);
}

async function handleChestStatus(request, env, corsHeaders) {
  const me = await getAuthUser(request, env);
  if (!me) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  const open = await env.DB.prepare('SELECT last_open_at FROM chest_opens WHERE username = ?').bind(me.username).first();
  const lastMs = open ? dtToMs(open.last_open_at) : null;
  const now = Date.now();
  const canOpen = !lastMs || now - lastMs >= CHEST_COOLDOWN_MS;

  const owned = (await env.DB.prepare('SELECT item_id FROM inventory WHERE username = ?').bind(me.username).all()).results.map(r => r.item_id);
  const creditRow = await env.DB.prepare('SELECT credits FROM chest_credits WHERE username = ?').bind(me.username).first();
  const giftedChests = Math.max(Number(creditRow?.credits) || 0, 0);

  return json({
    success: true,
    canOpen: canOpen || giftedChests > 0,
    next_open_at: giftedChests > 0 || canOpen ? null : (lastMs + CHEST_COOLDOWN_MS),
    gifted_chests: giftedChests,
    items: COSMETIC_ITEMS,
    owned,
    equipped: { glow: me.glow_item, color: me.color_item }
  }, 200, corsHeaders);
}

async function handleChestOpen(request, env, corsHeaders) {
  const me = await getAuthUser(request, env);
  if (!me) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  const now = Date.now();
  const creditRow = await env.DB.prepare('SELECT credits FROM chest_credits WHERE username = ?').bind(me.username).first();
  const giftedChests = Math.max(Number(creditRow?.credits) || 0, 0);
  const open = await env.DB.prepare('SELECT last_open_at FROM chest_opens WHERE username = ?').bind(me.username).first();
  const lastMs = open ? dtToMs(open.last_open_at) : null;
  const dailyAvailable = !lastMs || now - lastMs >= CHEST_COOLDOWN_MS;
  const usesGiftedChest = giftedChests > 0;
  if (!usesGiftedChest && !dailyAvailable) {
    return json({ error: 'Diese Kiste wurde bereits geöffnet. Nächste in ' + Math.ceil((CHEST_COOLDOWN_MS - (now - lastMs)) / 3600000) + ' Std.', next_open_at: lastMs + CHEST_COOLDOWN_MS }, 429, corsHeaders);
  }

  const ownedRows = (await env.DB.prepare('SELECT item_id FROM inventory WHERE username = ?').bind(me.username).all()).results;
  const ownedSet = new Set(ownedRows.map(r => r.item_id));
  const pool = COSMETIC_ITEMS.filter(i => !ownedSet.has(i.id));
  if (!pool.length) {
    return json({ error: 'Du hast bereits alle Items dieser Kiste gesammelt.' }, 409, corsHeaders);
  }

  const item = rollCosmetic(pool);

  await env.DB.prepare('INSERT INTO inventory (username, item_id, obtained_at) VALUES (?, ?, datetime(\'now\'))').bind(me.username, item.id).run();
  if (usesGiftedChest) {
    await env.DB.prepare('UPDATE chest_credits SET credits = credits - 1, updated_at = datetime(\'now\') WHERE username = ? AND credits > 0').bind(me.username).run();
  } else {
    await env.DB.prepare('INSERT INTO chest_opens (username, last_open_at) VALUES (?, datetime(\'now\')) ON CONFLICT(username) DO UPDATE SET last_open_at = excluded.last_open_at').bind(me.username).run();
  }

  const owned = (await env.DB.prepare('SELECT item_id FROM inventory WHERE username = ?').bind(me.username).all()).results.map(r => r.item_id);
  const fresh = await env.DB.prepare('SELECT glow_item, color_item FROM users WHERE username = ?').bind(me.username).first();

  return json({
    success: true,
    item,
    canOpen: usesGiftedChest ? giftedChests - 1 > 0 || dailyAvailable : false,
    next_open_at: usesGiftedChest
      ? (dailyAvailable ? null : lastMs + CHEST_COOLDOWN_MS)
      : now + CHEST_COOLDOWN_MS,
    gifted_chests: Math.max((usesGiftedChest ? giftedChests - 1 : giftedChests), 0),
    owned,
    equipped: { glow: fresh.glow_item, color: fresh.color_item }
  }, 200, corsHeaders);
}

async function handleAdminChestGrant(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const username = String(body.username || '').trim();
  const amount = Number(body.amount);
  if (!username) return json({ error: 'Kein Benutzername.' }, 400, corsHeaders);
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    return json({ error: 'Die Anzahl muss zwischen 1 und 100 liegen.' }, 400, corsHeaders);
  }

  const target = await env.DB.prepare('SELECT username FROM users WHERE username = ?').bind(username).first();
  if (!target) return json({ error: 'Benutzer nicht gefunden.' }, 404, corsHeaders);

  await env.DB.prepare(
    'INSERT INTO chest_credits (username, credits, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(username) DO UPDATE SET credits = credits + excluded.credits, updated_at = datetime(\'now\')'
  ).bind(username, amount).run();
  const row = await env.DB.prepare('SELECT credits FROM chest_credits WHERE username = ?').bind(username).first();
  return json({ success: true, username, gifted_chests: Number(row?.credits) || 0 }, 200, corsHeaders);
}

async function handleInventoryEquip(request, env, corsHeaders) {
  const me = await getAuthUser(request, env);
  if (!me) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const itemId = String(body.item_id || '');
  const item = cosmeticById(itemId);
  if (!item) return json({ error: 'Item existiert nicht.' }, 400, corsHeaders);

  const owned = await env.DB.prepare('SELECT id FROM inventory WHERE username = ? AND item_id = ?').bind(me.username, item.id).first();
  if (!owned) return json({ error: 'Du besitzt dieses Item nicht.' }, 403, corsHeaders);

  const col = item.cat === 'color' ? 'color_item' : 'glow_item';
  await env.DB.prepare(`UPDATE users SET ${col} = ? WHERE username = ?`).bind(item.id, me.username).run();

  const fresh = await env.DB.prepare('SELECT glow_item, color_item FROM users WHERE username = ?').bind(me.username).first();
  return json({ success: true, equipped: { glow: fresh.glow_item, color: fresh.color_item } }, 200, corsHeaders);
}

async function handleInventoryUnequip(request, env, corsHeaders) {
  const me = await getAuthUser(request, env);
  if (!me) return json({ error: 'Nicht angemeldet.' }, 401, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const cat = String(body.cat || '');
  if (cat !== 'glow' && cat !== 'color') return json({ error: 'Ungültige Kategorie.' }, 400, corsHeaders);

  const col = cat === 'color' ? 'color_item' : 'glow_item';
  await env.DB.prepare(`UPDATE users SET ${col} = NULL WHERE username = ?`).bind(me.username).run();

  const fresh = await env.DB.prepare('SELECT glow_item, color_item FROM users WHERE username = ?').bind(me.username).first();
  return json({ success: true, equipped: { glow: fresh.glow_item, color: fresh.color_item } }, 200, corsHeaders);
}

async function handleFeed(request, env, corsHeaders, settings) {
  const me = await getAuthUser(request, env);
  await cleanupExpiredAnnouncements(env);

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
  const roles = (await env.DB.prepare('SELECT name, color FROM custom_roles ORDER BY id').all()).results;

  return json({
    announcements,
    highlights,
    submissions,
    tickets,
    roles,
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
  if (kind === 'announcement' && (duration < 0 || duration > 31536000)) {
    return json({ error: 'Ungültige Dauer (max. 365 Tage).' }, 400, corsHeaders);
  }
  if (kind === 'highlight' && settings.highlights_enabled !== '1') {
    return json({ error: 'Highlights sind deaktiviert.' }, 403, corsHeaders);
  }
  if (kind === 'submission' && settings.feed_enabled !== '1') {
    return json({ error: 'Einsendungen sind derzeit deaktiviert.' }, 403, corsHeaders);
  }

  if ((kind === 'announcement' || kind === 'highlight') && user.role !== 'founder' && user.role !== 'admin') {
    return json({ error: 'Nur Founder/Admin dürfen das erstellen.' }, 403, corsHeaders);
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
  const staff = await isStaff(request, env);
  if (!staff) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  const status = body.status === 'closed' ? 'closed' : 'open';
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  await env.DB.prepare('UPDATE discord_tickets SET status = ? WHERE id = ?').bind(status, id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminTicketDelete(request, env, corsHeaders) {
  const staff = await isStaff(request, env);
  if (!staff) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  await env.DB.prepare('DELETE FROM discord_tickets WHERE id = ?').bind(id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminOverview(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

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
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const users = (await env.DB.prepare(
    'SELECT id, username, role, banned, created_at FROM users ORDER BY id' 
  ).all()).results;

  return json({ users }, 200, corsHeaders);
}

async function handleAdminUserRole(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  const role = String(body.role || '').trim().toLowerCase();

  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);
  if (!(await roleExists(role, env))) return json({ error: 'Ungültige Rolle.' }, 400, corsHeaders);

  const target = await env.DB.prepare('SELECT id, role FROM users WHERE id = ?').bind(id).first();
  if (!target) return json({ error: 'Benutzer nicht gefunden.' }, 404, corsHeaders);
  if (target.id === admin.id) return json({ error: 'Du kannst deine eigene Rolle nicht ändern.' }, 400, corsHeaders);
  if (target.role === 'founder' && admin.role !== 'founder') {
    return json({ error: 'Founder können nur vom Founder selbst verwaltet werden.' }, 403, corsHeaders);
  }
  if (role === 'founder' && admin.role !== 'founder') {
    return json({ error: 'Nur der Founder kann die Founder-Rolle vergeben.' }, 403, corsHeaders);
  }

  await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminUserBan(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  const banned = body.banned ? 1 : 0;

  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  const target = await env.DB.prepare('SELECT id, role FROM users WHERE id = ?').bind(id).first();
  if (!target) return json({ error: 'Benutzer nicht gefunden.' }, 404, corsHeaders);
  if (target.id === admin.id) return json({ error: 'Du kannst dich nicht selbst sperren.' }, 400, corsHeaders);
  if (target.role === 'founder' && admin.role !== 'founder') {
    return json({ error: 'Founder können nur vom Founder selbst moderiert werden.' }, 403, corsHeaders);
  }

  await env.DB.prepare('UPDATE users SET banned = ? WHERE id = ?').bind(banned, id).run();
  if (banned) {
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  }
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminUserDelete(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ?').bind(id).first();
  if (!user) return json({ error: 'Benutzer nicht gefunden.' }, 404, corsHeaders);
  if (user.id === admin.id) return json({ error: 'Du kannst dich nicht selbst löschen.' }, 400, corsHeaders);
  if (user.role === 'founder' && admin.role !== 'founder') {
    return json({ error: 'Founder können nur vom Founder selbst gelöscht werden.' }, 403, corsHeaders);
  }

  const postFiles = (await env.DB.prepare('SELECT file_key FROM posts WHERE author = ?').bind(user.username).all()).results;
  for (const p of postFiles) {
    if (p.file_key) await destroyCloudinaryAsset(env, p.file_key);
  }

  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
  await env.DB.prepare('DELETE FROM posts WHERE author = ?').bind(user.username).run();
  await env.DB.prepare('DELETE FROM discord_tickets WHERE author = ?').bind(user.username).run();
  await env.DB.prepare('DELETE FROM chat_messages WHERE author = ?').bind(user.username).run();
  await env.DB.prepare('DELETE FROM mutes WHERE username = ?').bind(user.username).run();
  await env.DB.prepare('DELETE FROM friend_requests WHERE from_user = ? OR to_user = ?').bind(user.username, user.username).run();
  await env.DB.prepare('DELETE FROM friends WHERE user_a = ? OR user_b = ?').bind(user.username, user.username).run();
  await env.DB.prepare('DELETE FROM dm_messages WHERE sender = ? OR recipient = ?').bind(user.username, user.username).run();
  await env.DB.prepare('DELETE FROM inventory WHERE username = ?').bind(user.username).run();
  await env.DB.prepare('DELETE FROM chest_opens WHERE username = ?').bind(user.username).run();
  await env.DB.prepare('DELETE FROM chest_credits WHERE username = ?').bind(user.username).run();
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminPosts(request, env, corsHeaders) {
  const staff = await isStaff(request, env);
  if (!staff) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const posts = (await env.DB.prepare(
    'SELECT id, kind, title, author, file_key, created_at, expires_at FROM posts ORDER BY id DESC LIMIT 200'
  ).all()).results;

  return json({ posts }, 200, corsHeaders);
}

async function handleAdminPostUpdate(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

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
  const staff = await isStaff(request, env);
  if (!staff) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  const post = await env.DB.prepare('SELECT id, file_key FROM posts WHERE id = ?').bind(id).first();
  if (post && post.file_key) await destroyCloudinaryAsset(env, post.file_key);
  await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminSecurity(request, env, corsHeaders) {
  const staff = await isStaff(request, env);
  if (!staff) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const logs = (await env.DB.prepare(
    'SELECT id, username, ip, ua, action, ipv4, ipv6, created_at FROM security_logs ORDER BY id DESC LIMIT 100'
  ).all()).results;

  return json({ logs }, 200, corsHeaders);
}

async function handleAdminSecurityClear(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  await env.DB.prepare('DELETE FROM security_logs').run();
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminSettingsGet(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const settings = await getSettings(env);
  return json({ settings }, 200, corsHeaders);
}

async function handleAdminSettingsSet(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const updates = body.settings || {};

  await setSettings(env, updates);
  const settings = await getSettings(env);
  return json({ success: true, settings }, 200, corsHeaders);
}

const PBKDF2_ITERATIONS = 100000;

async function roleExists(role, env) {
  if (['founder', 'moderator', 'member'].includes(role)) return true;
  const r = await env.DB.prepare('SELECT id FROM custom_roles WHERE name = ?').bind(role).first();
  return !!r;
}

async function destroyCloudinaryAsset(env, secureUrl) {
  try {
    const m = String(secureUrl || '').match(/\/v\d+\/(.+)$/);
    if (!m || !env.CLOUDINARY_CLOUD || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) return;
    const publicId = m[1].split('?')[0].replace(/\.[A-Za-z0-9]{2,5}$/, '');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const toSign = `invalidate=true&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = await sha1Hex(toSign + env.CLOUDINARY_API_SECRET);
    const form = new FormData();
    form.append('public_id', publicId);
    form.append('timestamp', timestamp);
    form.append('api_key', env.CLOUDINARY_API_KEY);
    form.append('signature', signature);
    form.append('invalidate', 'true');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD}/image/destroy`, {
      method: 'POST',
      body: form,
    });
  } catch (e) {}
}

async function cleanupExpiredAnnouncements(env) {
  const expired = (await env.DB.prepare(
    "SELECT id, file_key FROM posts WHERE kind = 'announcement' AND expires_at IS NOT NULL AND julianday(expires_at) <= julianday('now')"
  ).all()).results;
  if (!expired.length) return;
  for (const p of expired) {
    if (p.file_key) await destroyCloudinaryAsset(env, p.file_key);
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(p.id).run();
  }
}

async function handleAdminRolesList(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  const roles = (await env.DB.prepare('SELECT id, name, color, builtin FROM custom_roles ORDER BY id').all()).results;
  return json({ roles }, 200, corsHeaders);
}

async function handleAdminRoleCreate(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const name = String(body.name || '').trim().toLowerCase();
  const color = /^#[0-9a-fA-F]{6}$/.test(String(body.color || '')) ? String(body.color) : '#9a6fd8';

  if (name.length < 2 || name.length > 24) return json({ error: 'Der Name muss 2–24 Zeichen haben.' }, 400, corsHeaders);
  if (!/^[a-z0-9_\- ]+$/.test(name)) return json({ error: 'Nur Buchstaben, Zahlen, _ und - erlaubt.' }, 400, corsHeaders);
  const existing = await env.DB.prepare('SELECT id FROM custom_roles WHERE name = ?').bind(name).first();
  if (existing) return json({ error: 'Diese Rolle existiert bereits.' }, 409, corsHeaders);

  const result = await env.DB.prepare('INSERT INTO custom_roles (name, color, builtin) VALUES (?, ?, 0)').bind(name, color).run();
  return json({ success: true, id: result.meta.last_row_id }, 201, corsHeaders);
}

async function handleAdminRoleUpdate(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  const role = await env.DB.prepare('SELECT * FROM custom_roles WHERE id = ?').bind(id).first();
  if (!role) return json({ error: 'Rolle nicht gefunden.' }, 404, corsHeaders);

  if (role.builtin) {
    if (!/^#[0-9a-fA-F]{6}$/.test(String(body.color || ''))) return json({ error: 'Ungültige Farbe.' }, 400, corsHeaders);
    await env.DB.prepare('UPDATE custom_roles SET color = ? WHERE id = ?').bind(String(body.color), id).run();
    return json({ success: true }, 200, corsHeaders);
  }

  let name = role.name;
  if (body.name !== undefined) {
    name = String(body.name).trim().toLowerCase();
    if (name.length < 2 || name.length > 24) return json({ error: 'Der Name muss 2–24 Zeichen haben.' }, 400, corsHeaders);
    if (!/^[a-z0-9_\- ]+$/.test(name)) return json({ error: 'Nur Buchstaben, Zahlen, _ und - erlaubt.' }, 400, corsHeaders);
    const clash = await env.DB.prepare('SELECT id FROM custom_roles WHERE name = ? AND id != ?').bind(name, id).first();
    if (clash) return json({ error: 'Diese Rolle existiert bereits.' }, 409, corsHeaders);
  }
  let color = role.color;
  if (body.color !== undefined) {
    if (!/^[0-9a-fA-F]{6}$/.test(String(body.color).replace('#', ''))) return json({ error: 'Ungültige Farbe.' }, 400, corsHeaders);
    color = String(body.color);
  }

  await env.DB.prepare('UPDATE custom_roles SET name = ?, color = ? WHERE id = ?').bind(name, color, id).run();
  if (name !== role.name) {
    await env.DB.prepare('UPDATE users SET role = ? WHERE role = ?').bind(name, role.name).run();
  }
  return json({ success: true }, 200, corsHeaders);
}

async function handleAdminRoleDelete(request, env, corsHeaders) {
  const admin = await isAdmin(request, env);
  if (!admin) return json({ error: 'Keine Berechtigung.' }, 403, corsHeaders);

  let body = {};
  try { body = await request.json(); } catch (err) {}
  const id = Number(body.id);
  if (!id) return json({ error: 'Ungültige ID.' }, 400, corsHeaders);

  const role = await env.DB.prepare('SELECT * FROM custom_roles WHERE id = ?').bind(id).first();
  if (!role) return json({ error: 'Rolle nicht gefunden.' }, 404, corsHeaders);
  if (role.builtin) return json({ error: 'Diese Rolle kann nicht gelöscht werden.' }, 400, corsHeaders);

  await env.DB.prepare('UPDATE users SET role = ? WHERE role = ?').bind('member', role.name).run();
  await env.DB.prepare('DELETE FROM custom_roles WHERE id = ?').bind(id).run();
  return json({ success: true }, 200, corsHeaders);
}

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

async function sha1Hex(str) {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return toHex(new Uint8Array(hash));
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
