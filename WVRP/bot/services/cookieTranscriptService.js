import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import db from '../database/index.js';
dotenv.config();

export class CookieTranscriptService {
  constructor() {
    this.apiKey = process.env.COOKIE_API_KEY || '';
    this.baseUrl = process.env.COOKIE_API_BASE_URL || 'https://api.cookiebot.com/v1';
    this.localDir = path.resolve('transcripts');
    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateTranscript(ticketId, closingStaff = { tag: 'Staff', id: '0' }) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) return { success: false, error: 'Ticket not found' };

    const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY timestamp ASC').all(ticketId);

    const openedDate = new Date(ticket.created_at || Date.now());
    const closedDate = new Date();
    const durationMinutes = Math.max(1, Math.round((closedDate.getTime() - openedDate.getTime()) / 60000));

    // Try remote Cookie API if configured
    if (this.isConfigured()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${this.baseUrl}/transcripts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ticketId,
            channelName: `${ticket.category.toLowerCase().replace(/\s+/g, '-')}-${ticketId.padStart(4, '0')}`,
            guildName: 'West Virginia Roleplay',
            opener: { id: ticket.user_id, tag: ticket.user_tag },
            closer: { id: closingStaff.id, tag: closingStaff.tag },
            messages: messages.map(m => ({
              author: { id: m.author_id, tag: m.author_name },
              content: m.content,
              timestamp: m.timestamp
            }))
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            db.prepare('UPDATE tickets SET transcript_url = ? WHERE id = ?').run(data.url, ticketId);
            return {
              success: true,
              url: data.url,
              durationMinutes,
              messageCount: messages.length,
              handledBy: ticket.claimed_by || closingStaff.tag,
              closedBy: closingStaff.tag
            };
          }
        }
      } catch (err) {
        console.warn('Cookie API transcript request failed, falling back to local HTML transcript:', err.message);
      }
    }

    // High quality local HTML transcript fallback
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WVRP Ticket Transcript - #${ticketId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .header { background: #1e293b; padding: 20px; border-radius: 8px; border-left: 5px solid #00a8ff; margin-bottom: 24px; }
    .header h1 { margin: 0 0 10px 0; color: #38bdf8; font-size: 24px; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 14px; color: #94a3b8; }
    .meta span strong { color: #f1f5f9; }
    .message { display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #1e293b; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .msg-body { flex: 1; }
    .msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
    .author { font-weight: 600; color: #e2e8f0; }
    .time { font-size: 12px; color: #64748b; }
    .content { font-size: 14px; line-height: 1.5; color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="header">
    <h1>West Virginia Roleplay — Ticket #${ticketId}</h1>
    <div class="meta">
      <span><strong>Category:</strong> ${ticket.category}</span>
      <span><strong>Opener:</strong> ${ticket.user_tag} (${ticket.user_id})</span>
      <span><strong>Roblox User:</strong> ${ticket.roblox_username || 'N/A'}</span>
      <span><strong>Handled By:</strong> ${ticket.claimed_by || 'Unclaimed'}</span>
      <span><strong>Closed By:</strong> ${closingStaff.tag}</span>
      <span><strong>Duration:</strong> ${durationMinutes} minutes</span>
      <span><strong>Messages:</strong> ${messages.length}</span>
    </div>
  </div>
  <div class="messages">
    ${messages.map(m => `
      <div class="message">
        <div class="avatar">${m.author_name ? m.author_name.charAt(0).toUpperCase() : 'U'}</div>
        <div class="msg-body">
          <div class="msg-header">
            <span class="author">${m.author_name}</span>
            <span class="time">${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="content">${m.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

    const filePath = path.join(this.localDir, `ticket-${ticketId}.html`);
    fs.writeFileSync(filePath, htmlContent);

    const localUrl = `/transcripts/ticket-${ticketId}.html`;
    db.prepare('UPDATE tickets SET transcript_url = ? WHERE id = ?').run(localUrl, ticketId);

    return {
      success: true,
      url: localUrl,
      durationMinutes,
      messageCount: messages.length,
      handledBy: ticket.claimed_by || closingStaff.tag,
      closedBy: closingStaff.tag
    };
  }
}

export const cookieTranscriptService = new CookieTranscriptService();
export default cookieTranscriptService;
