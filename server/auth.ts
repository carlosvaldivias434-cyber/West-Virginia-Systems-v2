import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db/index.js';

export interface WebUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  avatarUrl: string;
  roles: string[];
  isStaff: boolean;
  isHighRank: boolean;
  isManagement: boolean;
  robloxUser?: {
    id: string;
    username: string;
    displayName?: string;
  } | null;
  csrfToken: string;
}

const SESSION_COOKIE_NAME = 'wvrp_session';
const STATE_COOKIE_NAME = 'oauth_state';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

// Role IDs from environment
export function getRoleConfig() {
  const parseList = (str?: string) =>
    (str || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  const staff = parseList(process.env.STAFF_ROLE_IDS);
  const highRank = parseList(process.env.HIGH_RANK_ROLE_IDS);
  const management = parseList(process.env.MANAGEMENT_ROLE_IDS);

  return {
    staffRoles: staff.length > 0 ? staff : ['123456789012345678'],
    highRankRoles: highRank.length > 0 ? highRank : ['123456789012345680'],
    managementRoles: management.length > 0 ? management : ['123456789012345681']
  };
}

/**
 * Determine permission levels strictly from Guild role IDs
 */
export function resolveUserPermissions(guildRoles: string[]) {
  const { staffRoles, highRankRoles, managementRoles } = getRoleConfig();

  const isManagement = guildRoles.some(r => managementRoles.includes(r));
  const isHighRank = isManagement || guildRoles.some(r => highRankRoles.includes(r));
  const isStaff = isHighRank || guildRoles.some(r => staffRoles.includes(r));

  return { isStaff, isHighRank, isManagement };
}

/**
 * Helper to get or link Roblox account from the database
 */
export function getLinkedRobloxUser(discordId: string) {
  try {
    const row = db.prepare('SELECT roblox_id, roblox_username, roblox_display_name FROM verifications WHERE discord_id = ?').get(discordId) as any;
    if (row && row.roblox_id) {
      return {
        id: row.roblox_id,
        username: row.roblox_username,
        displayName: row.roblox_display_name || row.roblox_username
      };
    }
  } catch (e) {
    // fallback
  }
  return null;
}

/**
 * Create a new persistent web session
 */
export function createSession(user: Omit<WebUser, 'csrfToken'>): { sessionId: string; user: WebUser } {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;

  const fullUser: WebUser = {
    ...user,
    csrfToken
  };

  db.prepare(`
    INSERT INTO web_sessions (id, user_id, user_data, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, user.id, JSON.stringify(fullUser), now, expiresAt);

  return { sessionId, user: fullUser };
}

/**
 * Retrieve session from cookie
 */
export function getSession(req: Request): WebUser | null {
  const sessionId = req.signedCookies?.[SESSION_COOKIE_NAME] || req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionId) return null;

  try {
    const row = db.prepare('SELECT user_data, expires_at FROM web_sessions WHERE id = ?').get(sessionId) as { user_data: string; expires_at: number } | undefined;
    if (!row) return null;

    if (Date.now() > row.expires_at) {
      db.prepare('DELETE FROM web_sessions WHERE id = ?').run(sessionId);
      return null;
    }

    const user = JSON.parse(row.user_data) as WebUser;
    const perms = resolveUserPermissions(user.roles || []);
    user.isStaff = perms.isStaff;
    user.isHighRank = perms.isHighRank;
    user.isManagement = perms.isManagement;
    user.robloxUser = getLinkedRobloxUser(user.id);
    return user;
  } catch (err) {
    return null;
  }
}

/**
 * Invalidate session on sign out
 */
export function destroySession(req: Request, res: Response) {
  const sessionId = req.signedCookies?.[SESSION_COOKIE_NAME] || req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    try {
      db.prepare('DELETE FROM web_sessions WHERE id = ?').run(sessionId);
    } catch {}
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

// Middleware: Attach user if present
export function attachUser(req: Request, res: Response, next: NextFunction) {
  const user = getSession(req);
  (req as any).user = user;
  next();
}

// Middleware: Require Signed In
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in with Discord.' });
  }
  next();
}

// Middleware: Require Staff
export function requireStaff(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as WebUser | undefined;
  if (!user || !user.isStaff) {
    return res.status(403).json({ error: 'Access denied: Staff privileges required.' });
  }
  next();
}

// Middleware: Require High Rank
export function requireHighRank(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as WebUser | undefined;
  if (!user || !user.isHighRank) {
    return res.status(403).json({ error: 'Access denied: High Rank clearance required.' });
  }
  next();
}

// Middleware: Require Management
export function requireManagement(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as WebUser | undefined;
  if (!user || !user.isManagement) {
    return res.status(403).json({ error: 'Access denied: Server Management clearance required.' });
  }
  next();
}

// Middleware: CSRF protection on POST routes
export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // Allow auth flow routes or webhooks
  if (req.path.startsWith('/api/auth/')) return next();

  const user = (req as any).user as WebUser | undefined;
  if (!user) return next();

  const tokenFromHeader = req.headers['x-csrf-token'] as string;
  const tokenFromBody = req.body?._csrf as string;

  if (!tokenFromHeader && !tokenFromBody) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }

  if ((tokenFromHeader || tokenFromBody) !== user.csrfToken) {
    return res.status(403).json({ error: 'CSRF token mismatch. Please refresh the page.' });
  }

  next();
}

/**
 * Handle Discord OAuth Authorization URL Generation
 */
export function generateOAuthLogin(req: Request, res: Response) {
  const clientId = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/callback`;

  // If OAuth is not configured with client credentials, direct to simulated sign-in helper
  if (!clientId || !process.env.DISCORD_CLIENT_SECRET) {
    return res.redirect('/api/auth/dev-prompt');
  }

  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds.members.read',
    state
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
}

/**
 * Handle Discord OAuth Callback
 */
export async function handleOAuthCallback(req: Request, res: Response) {
  const { code, state, error } = req.query;

  if (error || !code) {
    return res.redirect('/?auth_error=' + encodeURIComponent((error as string) || 'Access was denied'));
  }

  const storedState = req.cookies?.[STATE_COOKIE_NAME];
  if (!storedState || storedState !== state) {
    return res.redirect('/?auth_error=state_mismatch');
  }
  res.clearCookie(STATE_COOKIE_NAME);

  const clientId = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/callback`;
  const guildId = process.env.DISCORD_GUILD_ID || process.env.GUILD_ID;

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('OAuth token exchange failed:', errBody);
      return res.redirect('/?auth_error=token_failed');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!userRes.ok) {
      return res.redirect('/?auth_error=user_fetch_failed');
    }
    const discordUser = await userRes.json();

    // 3. Fetch Guild Member for Roles
    let guildRoles: string[] = [];
    if (guildId) {
      try {
        const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (memberRes.ok) {
          const memberData = await memberRes.json();
          guildRoles = memberData.roles || [];
        }
      } catch (e) {
        console.warn('Could not fetch guild member roles:', e);
      }
    }

    const perms = resolveUserPermissions(guildRoles);
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || '0', 10) % 5}.png`;

    const robloxUser = getLinkedRobloxUser(discordUser.id);

    const { sessionId } = createSession({
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
      avatarUrl,
      roles: guildRoles,
      ...perms,
      robloxUser
    });

    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      signed: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS,
      path: '/'
    });

    res.redirect('/my-profile');
  } catch (err: any) {
    console.error('OAuth callback exception:', err);
    res.redirect('/?auth_error=' + encodeURIComponent(err.message || 'Server error'));
  }
}

/**
 * Development & Emulation Login Route
 * Allows selecting role clearance (Guest, Staff, High Rank, Management)
 * to test all public and staff panels seamlessly in any environment.
 */
export function handleDevLogin(req: Request, res: Response) {
  const roleType = (req.query.role as string) || 'STAFF'; // 'GUEST' | 'STAFF' | 'HIGH_RANK' | 'MANAGEMENT'
  const customId = (req.query.userId as string) || '1416542687817105449';
  const customName = (req.query.username as string) || 'Trooper_Appalachian';

  let roles: string[] = [];
  const { staffRoles, highRankRoles, managementRoles } = getRoleConfig();

  if (roleType === 'MANAGEMENT') {
    roles = [managementRoles[0] || '123456789012345681', highRankRoles[0] || '123456789012345680', staffRoles[0] || '123456789012345678'];
  } else if (roleType === 'HIGH_RANK') {
    roles = [highRankRoles[0] || '123456789012345680', staffRoles[0] || '123456789012345678'];
  } else if (roleType === 'STAFF') {
    roles = [staffRoles[0] || '123456789012345678'];
  }

  const perms = resolveUserPermissions(roles);
  const robloxUser = getLinkedRobloxUser(customId) || {
    id: '1088134963',
    username: 'WV_Trooper42',
    displayName: 'WV_Trooper42'
  };

  const { sessionId } = createSession({
    id: customId,
    username: customName,
    discriminator: '0',
    avatar: null,
    avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces`,
    roles,
    ...perms,
    robloxUser
  });

  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    signed: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/'
  });

  const returnTo = (req.query.returnTo as string) || (perms.isStaff ? '/staff/overview' : '/my-profile');
  res.redirect(returnTo);
}
