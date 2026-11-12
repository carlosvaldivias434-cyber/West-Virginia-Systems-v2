import dotenv from 'dotenv';
import db from '../database/index.js';
import { WvrpEmbedBuilder } from '../embeds/wvrpEmbeds.js';
import groqService from './groqService.js';
import robloxService from './robloxService.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

dotenv.config();

export const WORKFLOW_TYPES = {
  FAST_PASS: 'fast_pass',
  DEPT_TRANSFER: 'dept_transfer',
  STAFF_APP: 'staff_app',
  ROBLOX_VERIFY: 'roblox_verify',
  BAN_APPEAL: 'ban_appeal',
  PARTNERSHIP: 'partnership',
  DEPT_APP: 'dept_app',
  GENERAL_SUPPORT: 'general_support',
  STAFF_COMPLAINT: 'staff_complaint',
  ERLC_SUPPORT: 'erlc_support'
};

export const WORKFLOW_DEFINITIONS = [
  {
    type: WORKFLOW_TYPES.FAST_PASS,
    name: 'Fast-Pass',
    category: 'Applications',
    emoji: process.env.FASTPASS_EMOJI || '⚡',
    keywords: ['fast pass', 'fast-pass', 'fastpass', 'skip trainee', 'staff transfer', 'experience transfer', 'rank transfer', 'transfer staff']
  },
  {
    type: WORKFLOW_TYPES.DEPT_TRANSFER,
    name: 'Department Transfers',
    category: 'Departments',
    emoji: '🚓',
    keywords: ['department transfer', 'dept transfer', 'transfer department', 'switch department', 'transfer to sheriff', 'transfer to state police', 'transfer to dot', 'transfer to fire']
  },
  {
    type: WORKFLOW_TYPES.STAFF_APP,
    name: 'Staff Applications',
    category: 'Careers',
    emoji: '📝',
    keywords: ['apply for staff', 'staff application', 'become staff', 'mod application', 'moderator application', 'how to apply', 'open applications', 'application hub']
  },
  {
    type: WORKFLOW_TYPES.ROBLOX_VERIFY,
    name: 'Roblox Verification',
    category: 'Verification',
    emoji: '🔗',
    keywords: ['verify', 'verification', 'bloxlink', 'link roblox', 'roblox account', 'verify account', 'check verify', 'how to verify', 'link account']
  },
  {
    type: WORKFLOW_TYPES.BAN_APPEAL,
    name: 'Ban Appeals',
    category: 'Moderation',
    emoji: '⚖️',
    keywords: ['appeal ban', 'ban appeal', 'unban', 'appeal my ban', 'unbanned', 'false ban', 'appeal suspension', 'appeal punishment']
  },
  {
    type: WORKFLOW_TYPES.PARTNERSHIP,
    name: 'Partnerships',
    category: 'Community',
    emoji: '🤝',
    keywords: ['partnership', 'partner', 'partner with us', 'server affiliate', 'affiliate', 'cross promo', 'partner requirements']
  },
  {
    type: WORKFLOW_TYPES.DEPT_APP,
    name: 'Department Applications',
    category: 'Departments',
    emoji: '🛡️',
    keywords: ['department application', 'dept application', 'join state police', 'join sheriff', 'join dot', 'join fire', 'join ems', 'wvsp app', 'kcso app', 'tryouts']
  },
  {
    type: WORKFLOW_TYPES.GENERAL_SUPPORT,
    name: 'General Support',
    category: 'Support',
    emoji: '⚙️',
    keywords: ['general help', 'need help', 'have a question', 'question about server', 'support please', 'help me please', 'general question']
  },
  {
    type: WORKFLOW_TYPES.STAFF_COMPLAINT,
    name: 'Staff Complaints',
    category: 'Internal Affairs',
    emoji: '🚨',
    keywords: ['staff complaint', 'report staff', 'report moderator', 'admin abuse', 'mod abuse', 'internal affairs', 'ia report', 'report an admin', 'staff issue']
  },
  {
    type: WORKFLOW_TYPES.ERLC_SUPPORT,
    name: 'ER:LC Server Support',
    category: 'ER:LC',
    emoji: '🎮',
    keywords: ['erlc', 'er:lc', 'server code', 'server join', 'in game issue', 'join code', 'erlc bug', 'private server', 'liberty county']
  }
];

export class TicketWorkflowService {
  constructor() {
    this.fastPassEmoji = process.env.FASTPASS_EMOJI || '⚡';
  }

  /**
   * Fast regex + keyword matching for high-performance instant detection
   */
  detectKeywordWorkflow(content) {
    if (!content || typeof content !== 'string') return null;
    const lower = content.toLowerCase().trim();

    for (const def of WORKFLOW_DEFINITIONS) {
      for (const kw of def.keywords) {
        // Word boundary match or exact substring match
        const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower) || lower.includes(kw)) {
          return {
            type: def.type,
            matchedKeyword: kw,
            confidence: 0.95,
            definition: def
          };
        }
      }
    }
    return null;
  }

  /**
   * Groq AI Semantic Context Recognition
   * Analyzes complex sentences or requests phrased unusually to accurately identify ticket intent
   */
  async detectGroqWorkflow(content, ticketCategory = 'General Support') {
    if (!groqService.isConfigured()) {
      return this.detectKeywordWorkflow(content);
    }

    try {
      const prompt = `You are the West Virginia State Roleplay (WVRP) Ticket Triage AI.
Analyze the user's message inside a Discord support ticket and classify which official workflow they are requesting.
Supported workflows:
1. fast_pass (user wants to skip trainee, transfer staff ranks, or mentions fast-pass)
2. dept_transfer (user requests to transfer between police/sheriff/fire/dot departments)
3. staff_app (user asks how to apply for staff, staff applications, requirements)
4. roblox_verify (user needs to link Roblox account, bloxlink, verification status)
5. ban_appeal (user wants to appeal a ban or punishment)
6. partnership (user wants a server partnership or affiliation)
7. dept_app (user wants to join or apply to a department like WVSP, KCSO, WVDOT)
8. staff_complaint (user is reporting staff member misconduct or admin abuse)
9. erlc_support (user asks about the ER:LC server, join code, in-game server issues)
10. general_support (standard member question or general assistance)
11. ambiguous (if truly unclear or multiple conflicting requests)
12. none (unrelated message, e.g. greeting or casual chat)

User message: "${content}"
Ticket category: "${ticketCategory}"

Respond strictly with a JSON object in this format:
{"workflow": "fast_pass"|"dept_transfer"|...|"none", "confidence": 0.0-1.0, "reason": "brief reason", "clarificationNeeded": false}`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqService.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: groqService.model || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: 'json_object' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        if (parsed.workflow && parsed.workflow !== 'none' && parsed.workflow !== 'ambiguous') {
          const def = WORKFLOW_DEFINITIONS.find(d => d.type === parsed.workflow);
          if (def && parsed.confidence >= 0.7) {
            return {
              type: parsed.workflow,
              matchedKeyword: `Groq AI: ${parsed.reason || parsed.workflow}`,
              confidence: parsed.confidence,
              definition: def,
              clarificationNeeded: Boolean(parsed.clarificationNeeded)
            };
          }
        }
      }
    } catch (e) {
      console.warn('Groq workflow detection fallback:', e.message);
    }

    return this.detectKeywordWorkflow(content);
  }

  /**
   * Generates the automated response payload for any supported workflow
   */
  generateWorkflowPayload(type, member = null, ticketId = '0000') {
    const memberMention = member?.id ? `<@${member.id}>` : '@Member';

    switch (type) {
      // 1. FAST-PASS
      case WORKFLOW_TYPES.FAST_PASS: {
        const embeds = WvrpEmbedBuilder.createFastPassEmbed({
          userMention: memberMention,
          fastPassEmoji: this.fastPassEmoji
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('workflow_fastpass_copy')
            .setLabel('Format Template')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('workflow_staff_review')
            .setLabel('Staff Review Queue')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Primary)
        );

        return {
          workflowType: type,
          content: `${this.fastPassEmoji} **Fast-Pass Application Instructions**`,
          embeds,
          components: [row]
        };
      }

      // 2. DEPARTMENT TRANSFERS
      case WORKFLOW_TYPES.DEPT_TRANSFER: {
        const embeds = WvrpEmbedBuilder.createDeptTransferEmbed({
          userMention: memberMention
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('workflow_transfer_copy')
            .setLabel('Format Template')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary)
        );

        return {
          workflowType: type,
          content: `🚓 **Department Transfer Application**`,
          embeds,
          components: [row]
        };
      }

      // 3. STAFF APPLICATIONS
      case WORKFLOW_TYPES.STAFF_APP: {
        const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'application',
          title: '📝 West Virginia Roleplay — Staff Applications',
          description: `Hello ${memberMention},\n\nInterested in joining the **West Virginia State Roleplay Staff Team**? All applications are conducted through our official Application Center.\n\n**Application Guidelines:**\n• You must be at least **13 years of age**\n• Good Spelling, Punctuation, and Grammar (SPaG) is mandatory\n• Submissions are scanned by **Sapling AI** for authenticity\n• Trainees must attend training within **7 days** of acceptance\n• Do not ping staff to review your application (causes instant denial)\n\nClick **Apply for Staff** below to begin your submission.`,
          footerText: 'West Virginia Roleplay · Staff Careers'
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('app_apply_staff')
            .setLabel('Apply for Staff')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Success)
        );

        return {
          workflowType: type,
          content: `📝 **Staff Application Hub**`,
          embeds,
          components: [row]
        };
      }

      // 4. ROBLOX VERIFICATION
      case WORKFLOW_TYPES.ROBLOX_VERIFY: {
        const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'verification',
          title: '🔗 Roblox & Bloxlink Verification Center',
          description: `Hello ${memberMention},\n\nTo link your Roblox account with West Virginia State Roleplay and access in-game ER:LC features:\n\n1. Visit the official **Bloxlink Verification Portal** below.\n2. Authorize your Roblox account with your Discord profile.\n3. Once linked, press **Check Verification** in this ticket to confirm.\n\n*Our staff team will automatically confirm your verified status once Bloxlink synchronization completes.*`,
          footerText: 'West Virginia State Roleplay · Verification Service'
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Verify on Bloxlink')
            .setEmoji('🔗')
            .setStyle(ButtonStyle.Link)
            .setURL(process.env.WELCOME_VERIFY_URL || 'https://blox.link/verify'),
          new ButtonBuilder()
            .setCustomId('verify_check_btn')
            .setLabel('Check Verification')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('verify_help_btn')
            .setLabel('Need Help?')
            .setEmoji('❓')
            .setStyle(ButtonStyle.Secondary)
        );

        return {
          workflowType: type,
          content: `🔗 **Roblox Verification Instructions**`,
          embeds,
          components: [row]
        };
      }

      // 5. BAN APPEALS
      case WORKFLOW_TYPES.BAN_APPEAL: {
        const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'infraction_appeal',
          title: '⚖️ West Virginia Roleplay — Ban & Punishment Appeal',
          description: `Hello ${memberMention},\n\nIf you were banned or suspended from West Virginia State Roleplay or our ER:LC server, please copy and complete the following appeal format:\n\n**Ban Appeal Format**\n\n**Roblox Username:**\n**Discord Username & ID:**\n**Date of Punishment:**\n**Issuing Moderator / Staff:**\n**Reason Stated for Ban:**\n**Why should your ban be lifted or reduced?**\n**Additional Evidence / Context:**\n\n*Appeals are evaluated strictly by Senior High Rank & Community Directive.*`,
          footerText: 'West Virginia Roleplay · Judicial Appeals'
        });

        return {
          workflowType: type,
          content: `⚖️ **Ban Appeal Instructions**`,
          embeds
        };
      }

      // 6. PARTNERSHIPS
      case WORKFLOW_TYPES.PARTNERSHIP: {
        const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'community',
          title: '🤝 West Virginia Roleplay — Partnership Requirements',
          description: `Hello ${memberMention},\n\nThank you for your interest in partnering with **West Virginia State Roleplay**!\n\n**Partnership Requirements:**\n• Minimum **150+ legitimate members** (no bot accounts)\n• Well-structured Discord server with clear rules and active moderation\n• ER:LC or Roblox roleplay community preferred\n• Mutual representative account must remain in both servers\n• Representative will post partner ad in their server within 24 hours\n\n**To proceed, please provide:**\n1. Your server invite link\n2. Your server name & member count\n3. Your partnership representative contact\n4. Your server advertisement text`,
          footerText: 'West Virginia Roleplay · Community Outreach'
        });

        return {
          workflowType: type,
          content: `🤝 **Partnership Requirements**`,
          embeds
        };
      }

      // 7. DEPARTMENT APPLICATIONS
      case WORKFLOW_TYPES.DEPT_APP: {
        const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'departments',
          title: '🛡️ West Virginia State Departments',
          description: `Hello ${memberMention},\n\nWest Virginia State Roleplay features the following whitelisted law enforcement and emergency departments:\n\n• **West Virginia State Police (WVSP)** — Highway patrol and primary jurisdiction.\n• **Kanawha County Sheriff's Office (KCSO)** — County patrol, warrant service, and community policing.\n• **WV Division of Forestry** — Rural patrol, conservation, and state park management.\n• **Department of Transportation (WVDOT)** — Traffic management, road service, and escort.\n• **West Virginia Fire & EMS** — Fire suppression, rescue operations, and trauma medical care.\n\n*Applications open periodically when announced in Discord. Watch the departmental tryouts channel for open recruitments.*`,
          footerText: 'West Virginia Roleplay · Department Oversight'
        });

        return {
          workflowType: type,
          content: `🛡️ **Department Applications & Information**`,
          embeds
        };
      }

      // 8. GENERAL SUPPORT
      case WORKFLOW_TYPES.GENERAL_SUPPORT: {
        const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'ticket',
          title: '⚙️ West Virginia Roleplay — General Support',
          description: `Hello ${memberMention},\n\nThank you for reaching out to the **West Virginia State Roleplay Support Team**.\n\nPlease describe your inquiry with as much detail as possible. A human staff member will be with you shortly.\n\n• Remember to keep chat civil and respectful\n• Do not ping individual staff members\n• Have any screenshots or relevant links ready`,
          footerText: 'West Virginia Roleplay · Support Center'
        });

        return {
          workflowType: type,
          content: `⚙️ **General Support Assistance**`,
          embeds
        };
      }

      // 9. STAFF COMPLAINTS
      case WORKFLOW_TYPES.STAFF_COMPLAINT: {
        const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'infraction',
          title: '🚨 Internal Affairs — Staff Complaint Protocol',
          description: `Hello ${memberMention},\n\nWest Virginia State Roleplay takes staff misconduct and abuse seriously. To initiate an **Internal Affairs** investigation, please provide:\n\n**Staff Complaint Format**\n\n**Staff Member's Username / Tag:**\n**Approximate Date & Time:**\n**Server / Channel where incident occurred:**\n**Detailed description of what occurred:**\n**Direct Evidence (Video clip, screenshots, audit log reference):**\n\n*False reports or reports without evidence will be discarded.*`,
          footerText: 'West Virginia Roleplay · Internal Affairs'
        });

        return {
          workflowType: type,
          content: `🚨 **Internal Affairs Staff Complaint**`,
          embeds
        };
      }

      // 10. ER:LC SUPPORT
      case WORKFLOW_TYPES.ERLC_SUPPORT:
      default: {
        const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'erlc_server_info',
          title: '🎮 Emergency Response: Liberty County — Server Support',
          description: `Hello ${memberMention},\n\nWelcome to West Virginia State Roleplay in ER:LC!\n\n**Server Information:**\n• **Join Code:** \`wvrp\`\n• **Owner:** \`WVRP Management\`\n• **Strict Roleplay:** Follow all server rules (No FRP, No RDM/VDM, No LTAP)\n• **Shift Commands:** Staff use \`;shift start\` or \`;shift 50/50\` in game chat\n\nClick **Join ER:LC Server** below to join directly!`,
          footerText: 'West Virginia Roleplay · ER:LC Operations'
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Join ER:LC Server')
            .setEmoji('🚨')
            .setStyle(ButtonStyle.Link)
            .setURL(process.env.WELCOME_ERLC_JOIN_URL || 'https://policeroleplay.community/join/wvrp')
        );

        return {
          workflowType: type,
          content: `🎮 **ER:LC Server Support**`,
          embeds,
          components: [row]
        };
      }
    }
  }

  /**
   * Evaluates incoming message inside a ticket channel and sends auto response if matching
   */
  async processTicketMessage(ticketId, channel, message) {
    if (message.author?.bot) return null;

    // Check if auto responses enabled
    if (process.env.TICKET_WORKFLOWS_ENABLED === 'false') return null;

    // First detect intent via keywords + Groq AI
    const detection = await this.detectGroqWorkflow(message.content);
    if (!detection) return null;

    // Check deduplication in database: avoid sending duplicate responses for the same ticket & workflow
    const alreadySent = db.prepare(`
      SELECT * FROM ticket_auto_responses
      WHERE ticket_id = ? AND workflow_type = ?
    `).get(ticketId, detection.type);

    if (alreadySent) {
      console.log(`Auto response for workflow ${detection.type} already sent to ticket ${ticketId}. Skipping duplicate.`);
      return null;
    }

    // Generate payload
    const payload = this.generateWorkflowPayload(detection.type, message.author, ticketId);

    let messageId = null;
    if (channel && typeof channel.send === 'function') {
      try {
        const sent = await channel.send({
          content: payload.content,
          embeds: payload.embeds,
          components: payload.components || []
        });
        messageId = sent.id;
      } catch (err) {
        console.error('Error sending auto response to ticket:', err.message);
      }
    }

    // Persist auto response and workflow state
    try {
      db.prepare(`
        INSERT INTO ticket_auto_responses (ticket_id, workflow_type, message_id, trigger_phrase, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(ticketId, detection.type, messageId || `sim_${Date.now()}`, detection.matchedKeyword, Date.now());

      db.prepare(`
        INSERT INTO ticket_automation_workflows (ticket_id, channel_id, user_id, workflow_type, trigger_source, matched_phrase, status, created_at)
        VALUES (?, ?, ?, ?, 'keyword_ai', ?, 'ACTIVE', ?)
      `).run(ticketId, channel?.id || 'channel', message.author?.id || 'user', detection.type, detection.matchedKeyword, Date.now());
    } catch (e) {
      console.warn('Error saving ticket workflow to DB:', e.message);
    }

    return {
      success: true,
      workflowType: detection.type,
      matchedKeyword: detection.matchedKeyword,
      confidence: detection.confidence,
      payload
    };
  }

  /**
   * Allows authorized staff to manually trigger or override workflow in a ticket
   */
  async triggerManualWorkflow(ticketId, channel, workflowType, staffMember) {
    const valid = Object.values(WORKFLOW_TYPES);
    if (!valid.includes(workflowType)) {
      return { success: false, error: `Invalid workflow type: ${workflowType}` };
    }

    const payload = this.generateWorkflowPayload(workflowType, null, ticketId);

    let messageId = null;
    if (channel && typeof channel.send === 'function') {
      try {
        const sent = await channel.send({
          content: `${payload.content} *(Manually triggered by @${staffMember.username || staffMember.tag})*`,
          embeds: payload.embeds,
          components: payload.components || []
        });
        messageId = sent.id;
      } catch (err) {
        console.error('Error sending manual workflow:', err.message);
      }
    }

    db.prepare(`
      INSERT INTO ticket_automation_workflows (ticket_id, channel_id, user_id, workflow_type, trigger_source, matched_phrase, status, created_at)
      VALUES (?, ?, ?, ?, 'staff_manual', ?, 'ACTIVE', ?)
    `).run(ticketId, channel?.id || 'channel', staffMember.id, workflowType, `Manual trigger by ${staffMember.username}`, Date.now());

    return {
      success: true,
      workflowType,
      staff: staffMember.username,
      payload
    };
  }

  getActiveWorkflows(limit = 30) {
    return db.prepare('SELECT * FROM ticket_automation_workflows ORDER BY created_at DESC LIMIT ?').all(limit);
  }

  getRecentAutoResponses(limit = 30) {
    return db.prepare('SELECT * FROM ticket_auto_responses ORDER BY created_at DESC LIMIT ?').all(limit);
  }
}

export const ticketWorkflowService = new TicketWorkflowService();
export default ticketWorkflowService;
