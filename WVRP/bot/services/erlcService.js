import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://api.erlc.gg/v2';

export class ErlcService {
  constructor() {
    this.apiKey = process.env.ERLC_API_KEY || '';
    this.cache = {
      server: null,
      players: [],
      staff: null,
      joinLogs: [],
      queue: [],
      killLogs: [],
      commandLogs: [],
      modCalls: [],
      emergencyCalls: [],
      vehicles: [],
      lastUpdated: 0
    };
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getHeaders() {
    return {
      'server-key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        error: 'ER:LC API key is not configured in .env (ERLC_API_KEY). ER:LC features are disabled while other bot systems run normally.'
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        return {
          success: false,
          status: response.status,
          error: `ER:LC API error (${response.status}): ${text || response.statusText}`
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: `Failed to reach ER:LC API: ${err.message}`
      };
    }
  }

  async getServerInfo() {
    const res = await this.request('/server');
    if (res.success) {
      this.cache.server = res.data;
      this.cache.lastUpdated = Date.now();
    }
    return res;
  }

  async getPlayers() {
    const res = await this.request('/server?Players=true');
    if (res.success && res.data?.Players) {
      this.cache.players = res.data.Players;
    }
    return res;
  }

  async getStaff() {
    const res = await this.request('/server?Staff=true');
    if (res.success && res.data?.Staff) {
      this.cache.staff = res.data.Staff;
    }
    return res;
  }

  async getJoinLogs() {
    const res = await this.request('/server?JoinLogs=true');
    if (res.success && res.data?.JoinLogs) {
      this.cache.joinLogs = res.data.JoinLogs;
    }
    return res;
  }

  async getQueue() {
    const res = await this.request('/server?Queue=true');
    if (res.success && res.data?.Queue) {
      this.cache.queue = res.data.Queue;
    }
    return res;
  }

  async getKillLogs() {
    const res = await this.request('/server?KillLogs=true');
    if (res.success && res.data?.KillLogs) {
      this.cache.killLogs = res.data.KillLogs;
    }
    return res;
  }

  async getCommandLogs() {
    const res = await this.request('/server?CommandLogs=true');
    if (res.success && res.data?.CommandLogs) {
      this.cache.commandLogs = res.data.CommandLogs;
    }
    return res;
  }

  async getEmergencyCalls() {
    const res = await this.request('/server?EmergencyCalls=true');
    if (res.success && res.data?.EmergencyCalls) {
      this.cache.emergencyCalls = res.data.EmergencyCalls;
    }
    return res;
  }

  async getModCalls() {
    const res = await this.request('/server?ModCalls=true');
    if (res.success && res.data?.ModCalls) {
      this.cache.modCalls = res.data.ModCalls;
    }
    return res;
  }

  async getVehicles() {
    const res = await this.request('/server?Vehicles=true');
    if (res.success && res.data?.Vehicles) {
      this.cache.vehicles = res.data.Vehicles;
    }
    return res;
  }

  async getAllData() {
    const res = await this.request('/server?Players=true&Staff=true&JoinLogs=true&Queue=true&KillLogs=true&CommandLogs=true&ModCalls=true&EmergencyCalls=true&Vehicles=true');
    if (res.success && res.data) {
      this.cache = {
        server: res.data,
        players: res.data.Players || [],
        staff: res.data.Staff || null,
        joinLogs: res.data.JoinLogs || [],
        queue: res.data.Queue || [],
        killLogs: res.data.KillLogs || [],
        commandLogs: res.data.CommandLogs || [],
        modCalls: res.data.ModCalls || [],
        emergencyCalls: res.data.EmergencyCalls || [],
        vehicles: res.data.Vehicles || [],
        lastUpdated: Date.now()
      };
    }
    return res;
  }

  async runCommand(commandString) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ER:LC API is not configured. Command could not be transmitted to the in-game server.'
      };
    }

    return await this.request('/server/command', {
      method: 'POST',
      body: JSON.stringify({ command: commandString })
    });
  }
}

export const erlcService = new ErlcService();
export default erlcService;
