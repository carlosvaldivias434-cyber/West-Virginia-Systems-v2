import { db } from '../db/index.js';

export interface TicketMessage {
  id?: number;
  ticket_id: string;
  author_id: string;
  author_name: string;
  content: string;
  attachments?: string;
  timestamp: number;
}

export class TranscriptService {
  /**
   * Function the Discord bot or server calls to save a single message
   */
  saveTicketMessage(ticketId: string, authorId: string, authorName: string, content: string, attachments: string = '') {
    return db.prepare(`
      INSERT INTO ticket_messages (ticket_id, author_id, author_name, content, attachments, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ticketId, authorId, authorName, content, attachments, Date.now());
  }

  /**
   * Save a collection of messages when a Discord ticket channel closes
   */
  saveBulkTicketMessages(ticketId: string, messages: Array<{ authorId: string; authorName: string; content: string; attachments?: string; timestamp?: number }>) {
    const insert = db.prepare(`
      INSERT INTO ticket_messages (ticket_id, author_id, author_name, content, attachments, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const m of messages) {
        insert.run(ticketId, m.authorId, m.authorName, m.content, m.attachments || '', m.timestamp || Date.now());
      }
    })();
  }

  /**
   * Retrieve transcript by ticket ID with authorized access check
   */
  getTicketTranscript(ticketId: string, requestingUser?: { id: string; isStaff: boolean } | null) {
    const ticket = db.prepare('SELECT *, id as ticket_id, user_id as opener_id, user_tag as opener_tag, closed_by as closer_tag FROM tickets WHERE id = ?').get(ticketId) as any;
    if (!ticket) return null;

    // Check authorization: ticket opener or staff member
    if (requestingUser) {
      const isOwner = String(ticket.user_id) === String(requestingUser.id);
      if (!isOwner && !requestingUser.isStaff) {
        return { authorized: false, ticket: null, messages: [] };
      }
    }

    const rawMessages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY timestamp ASC').all(ticketId) as any[];
    const messages = rawMessages.map(m => ({
      id: String(m.id),
      ticket_id: m.ticket_id,
      author_id: m.author_id,
      author_name: m.author_name,
      author_tag: m.author_name || 'Member',
      content: m.content || '',
      attachments: m.attachments || '',
      is_bot: m.author_id === 'BOT' || (m.author_name && /bot/i.test(m.author_name)) ? 1 : 0,
      is_staff: m.author_id === 'STAFF' || (m.author_name && /staff|trooper|mod|admin/i.test(m.author_name)) ? 1 : 0,
      timestamp: m.timestamp || Date.now(),
      created_at: m.timestamp || Date.now()
    }));

    return {
      ticketId,
      authorized: true,
      ticket,
      messages
    };
  }

  /**
   * List ticket transcripts for user or staff with complete normalized aliases
   */
  listTranscripts(userId?: string, isStaff: boolean = false) {
    const fields = `
      id, id as ticket_id, user_id, user_id as opener_id, user_tag, user_tag as opener_tag,
      category, inquiry, status, created_at, closed_at, closed_by, closed_by as closer_tag,
      (SELECT COUNT(*) FROM ticket_messages WHERE ticket_messages.ticket_id = tickets.id) as message_count
    `;

    if (isStaff) {
      return db.prepare(`SELECT ${fields} FROM tickets ORDER BY closed_at DESC, created_at DESC LIMIT 50`).all();
    }
    if (userId) {
      return db.prepare(`SELECT ${fields} FROM tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`).all(userId);
    }
    return [];
  }
}

export const transcriptService = new TranscriptService();
export default transcriptService;
