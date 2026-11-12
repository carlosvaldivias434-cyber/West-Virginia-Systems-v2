import dotenv from 'dotenv';
import db from '../database/index.js';
dotenv.config();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getKnowledgeBase() {
    return `
West Virginia Roleplay (WVRP) Community Knowledge Base:
- Community: West Virginia Roleplay is a premier Emergency Response: Liberty County (ER:LC) Roblox community.
- Regulations: Strict roleplay standards. Respect all members, no RDM (Random Deathmatch), no VDM (Vehicle Deathmatch), no LTAP (Leaving to Avoid Punishment), no FRP (Fear Roleplay failure), no NLR (New Life Rule) violations.
- Whitelisted Departments: West Virginia State Police (WVSP), Kanawha County Sheriff's Office (KCSO), WV Division of Forestry, Department of Transportation (WVDOT), Fire & EMS, Manfredi Family (whitelisted org).
- Joining Departments: Trainees and regular members can apply when applications or tryouts are announced in the Discord.
- Staff Applications: Handled directly in the WVRP Application Hub (#applications) via 15 comprehensive questions. Applicants must be over 13 years old, possess good SPaG, and avoid AI. Trainees must attend training within 7 days.
- Support Tickets: Categories include General Support, High Rank Support, Department Support, Internal Affairs / Staff Reports, and Purchase Redemption.
- Shifts: Staff use /shift commands or in-game chat commands (;shift start, ;shift 50/50, ;shift break, ;shift end).
- Session Management: Sessions are managed by Community Directive & Management. Live status and notifications are posted in the session channel.
- Marketplace: Offers paid advertisements, sponsored giveaways, custom office voice channels, VIP packages, and donor perks. All purchases are final and claimable via tickets.
`;
  }

  async generateTicketResponse(ticketId, userMessage, conversationHistory = []) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) return { success: false, error: 'Ticket not found' };

    if (ticket.ai_status === 'DISABLED' || ticket.ai_status === 'PAUSED' || ticket.ai_status === 'HUMAN_TAKEOVER') {
      return { success: false, skipped: true, status: ticket.ai_status };
    }

    if (!this.isConfigured()) {
      return this.triggerHandoff(ticketId, "The AI couldn't be reached (API key not configured).");
    }

    try {
      const messages = [
        {
          role: 'system',
          content: `You are the West Virginia Roleplay (WVRP) Universal AI Personal Assistant.
You are a highly capable, polite, and intelligent assistant designed to help members with practically anything:
- Universal Assistance: Answer general questions, explain complex educational subjects (math, science, history, logic), assist with creative or professional writing, and provide structured instructions and recommendations.
- Technology & Gaming: Troubleshoot Discord, Roblox errors, ER:LC controls, server connections, audio/mic setups, and client issues.
- WVRP Knowledge: Possess deep knowledge of West Virginia Roleplay (rules, sessions, departments, applications, shifts, and tickets).
- Conversation & Memory: Remember the full ticket context, ask intelligent follow-up questions when details are ambiguous, and provide actionable next steps.
- Staff Escalation: If a member reports staff abuse, requests sensitive high-rank decisions, submits an infraction appeal, or encounters an issue that only human leadership can handle, politely explain that human staff have been alerted and will assist shortly.
- Identity: Never pretend to be a human staff member or make official moderation decisions. Be welcoming, articulate, and immensely helpful.

Approved Community Knowledge:
${this.getKnowledgeBase()}`
        },
        ...conversationHistory.map(m => ({
          role: m.author_id === 'AI_ASSISTANT' ? 'assistant' : 'user',
          content: `${m.author_name}: ${m.content}`
        })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.5,
          max_tokens: 450
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return this.triggerHandoff(ticketId, `Groq API responded with status ${res.status}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (!reply) {
        return this.triggerHandoff(ticketId, 'Empty response from AI model.');
      }

      // Record AI message
      db.prepare(`
        INSERT INTO ticket_messages (ticket_id, author_id, author_name, content, attachments, timestamp)
        VALUES (?, 'AI_ASSISTANT', 'WVRP Staff Helper AI', ?, '[]', ?)
      `).run(ticketId, reply, Date.now());

      return {
        success: true,
        reply,
        footer: 'AI Assistant · WVRP Support Helper'
      };
    } catch (err) {
      return this.triggerHandoff(ticketId, `Network or timeout error: ${err.message}`);
    }
  }

  triggerHandoff(ticketId, reason) {
    db.prepare(`
      UPDATE tickets
      SET ai_status = 'HANDOFF', ai_summary = ?
      WHERE id = ?
    `).run(`Handoff to human staff: ${reason}`, ticketId);

    return {
      success: true,
      handedOff: true,
      message: `I can't reply right now, so a human staff member will assist you shortly.\n\n**Summary for staff:** The AI couldn't be reached.`,
      footer: 'AI Assistant · Handed to staff',
      reason
    };
  }

  handleStaffMessage(ticketId, staffMember) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) return;

    if (ticket.ai_status !== 'HUMAN_TAKEOVER' && ticket.ai_status !== 'DISABLED') {
      db.prepare(`
        UPDATE tickets
        SET ai_status = 'HUMAN_TAKEOVER',
            ai_summary = ?
        WHERE id = ?
      `).run(`Human takeover by ${staffMember.tag || staffMember.username} (${staffMember.id}) at ${new Date().toISOString()}`, ticketId);
    }
  }

  setAiControl(ticketId, action, staffMember) {
    const valid = ['PAUSE', 'RESUME', 'DISABLE', 'ENABLE', 'TAKEOVER'];
    if (!valid.includes(action)) return { success: false, error: 'Invalid AI action' };

    let newStatus = 'ENABLED';
    let bannerText = '';

    if (action === 'PAUSE') {
      newStatus = 'PAUSED';
      bannerText = 'AI Assistant · Paused by Staff';
    } else if (action === 'RESUME') {
      newStatus = 'ENABLED';
      bannerText = 'AI Assistant · Resumed by Staff';
    } else if (action === 'DISABLE') {
      newStatus = 'DISABLED';
      bannerText = 'AI Assistant · Disabled';
    } else if (action === 'ENABLE') {
      newStatus = 'ENABLED';
      bannerText = 'AI Assistant · Enabled';
    } else if (action === 'TAKEOVER') {
      newStatus = 'HUMAN_TAKEOVER';
      bannerText = 'AI Assistant · Human Staff Takeover';
    }

    db.prepare('UPDATE tickets SET ai_status = ? WHERE id = ?').run(newStatus, ticketId);
    return { success: true, status: newStatus, bannerText };
  }
}

export const groqService = new GroqService();
export default groqService;
