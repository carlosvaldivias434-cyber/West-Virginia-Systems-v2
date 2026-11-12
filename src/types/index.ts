export interface User {
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

export interface Department {
  id: string;
  name: string;
  description: string;
  role_id: string;
  reviewer_role_id: string;
}

export interface LiveStats {
  erlc: {
    players: number;
    maxPlayers: number;
    queue: number;
    status: 'ONLINE' | 'OFFLINE' | 'UNAVAILABLE';
    serverName: string;
    joinCode: string;
  };
  discord: {
    memberCount: number;
    onlineCount: number;
  };
  staff: {
    onDutyCount: number;
  };
  community: {
    name: string;
    shortName: string;
    tagline: string;
    discordInviteUrl: string;
    robloxGroupUrl: string;
    quickJoinUrl: string;
  };
}

export interface ModerationCase {
  id: string;
  target_id: string;
  target_username: string;
  moderator_id: string;
  moderator_username: string;
  action_type: string;
  reason: string;
  duration?: string | null;
  status: string;
  timestamp: number;
}

export interface WatchdogAlert {
  id: number;
  alert_type: string;
  player_name: string;
  roblox_id: string;
  confidence: number;
  details: string;
  recommended_action: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  created_at: number;
  action_taken?: string;
  action_by?: string;
  resolved_at?: number;
}
