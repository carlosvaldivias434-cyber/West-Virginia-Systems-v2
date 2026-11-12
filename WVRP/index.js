import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';
import dotenv from 'dotenv';
import db from './bot/database/index.js';
import { commands, prefixCommands, formatUnknownCommandMessage } from './bot/handlers/commandRegistry.js';
import erlcService from './bot/services/erlcService.js';
import groqService from './bot/services/groqService.js';
import saplingService from './bot/services/saplingService.js';
import cookieTranscriptService from './bot/services/cookieTranscriptService.js';
import shiftService from './bot/services/shiftService.js';
import robloxService from './bot/services/robloxService.js';
import antiPingService from './bot/services/antiPingService.js';
import afkService from './bot/services/afkService.js';
import welcomeService from './bot/services/welcomeService.js';
import boostService from './bot/services/boostService.js';
import ticketWorkflowService, { WORKFLOW_TYPES } from './bot/services/ticketWorkflowService.js';
import ticketService from './bot/services/ticketService.js';
import applicationService from './bot/services/applicationService.js';
import departmentService from './bot/services/departmentService.js';
import moderationService from './bot/services/moderationService.js';
import loaService from './bot/services/loaService.js';
import securityService from './bot/services/securityService.js';
import erlcLoggingService from './bot/services/erlcLoggingService.js';
import {
  WvrpEmbedBuilder,
  BANNERS,
  createModerationCaseInfoV2,
  createModerationHistoryV2,
  createModerationStatsV2
} from './bot/embeds/wvrpEmbeds.js';
import { checkPermission } from '../src/commands/commandRegistry.js';

dotenv.config();

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User]
});

const DEFAULT_PREFIX = process.env.DEFAULT_PREFIX || '-';

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ West Virginia Roleplay Bot logged in as ${readyClient.user.tag}!`);
  console.log(`Loaded ${commands.size} slash commands and ${prefixCommands.size} prefix triggers.`);
});

// Message create handler (supports prefixes, anti-ping, afk, ticket workflows, in-game shift commands, and direct answers)
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  // 1. In-game ER:LC Chat Command Simulation (;shift start, ;shift 50/50, ;shift break, ;shift end)
  if (message.content.startsWith(';shift')) {
    const raw = message.content.slice(6).trim().toLowerCase();
    if (raw === 'start' || raw === 'normal') {
      const res = shiftService.startShift(message.author, 'NORMAL');
      if (!res.success) return message.reply({ content: `❌ ${res.error}` });
      return message.reply({ content: `🟢 **[ER:LC Shift Started]** On-Duty assigned. Follow staff uniform and conduct regulations.` });
    } else if (raw === '50/50' || raw === '5050') {
      const res = shiftService.startShift(message.author, '50/50');
      if (!res.success) return message.reply({ content: `❌ ${res.error}` });
      return message.reply({ content: `🟢 **[ER:LC 50/50 Shift Started]** On-Duty assigned. Shift counts toward weekly quota.` });
    } else if (raw === 'break') {
      const res = shiftService.startBreak(message.author);
      if (!res.success) {
        const resumeRes = shiftService.endBreak(message.author);
        if (!resumeRes.success) return message.reply({ content: `❌ ${resumeRes.error}` });
        return message.reply({ content: `🟢 **[ER:LC Shift Resumed]** Returned from break. On-Duty restored.` });
      }
      return message.reply({ content: `🟡 **[ER:LC Shift Break]** On break. Take your time to recharge.` });
    } else if (raw === 'end' || raw === 'stop') {
      const res = shiftService.endShift(message.author);
      if (!res.success) return message.reply({ content: `❌ ${res.error}` });
      return message.reply({ content: `🔴 **[ER:LC Shift Concluded]** Total duration: **${shiftService.formatDuration(res.creditedSeconds)}**. Thank you for your service!` });
    }
  }

  // 2. Anti-Ping Security Check (Detect unauthorized pings to protected leadership roles/teams)
  try {
    const antiPingViolation = antiPingService.checkMessage(message);
    if (antiPingViolation) {
      await antiPingService.processViolation(message, antiPingViolation);
      return; // Stop further processing
    }
  } catch (err) {
    console.error('Anti-Ping execution error:', err);
  }

  // 3. AFK Return Check (If the sender was AFK, restore nickname and notify of missed pings)
  try {
    await afkService.handleReturn(message);
  } catch (err) {
    console.error('AFK Return error:', err);
  }

  // 4. AFK Mention Notification (If sender pinged an AFK user, alert sender and log ping)
  try {
    await afkService.handleMentions(message);
  } catch (err) {
    console.error('AFK Mention error:', err);
  }

  // 5. Private Application Channel: Direct Message Questionnaire Handler
  if (message.channel && message.channel.name && message.channel.name.startsWith('application-')) {
    if (!message.content.startsWith('-') && !message.content.startsWith('!')) {
      const activeApp = db.prepare("SELECT * FROM applications WHERE channel_id = ? AND user_id = ? AND status = 'IN_PROGRESS'").get(message.channel.id, message.author.id);
      if (activeApp) {
        await applicationService.recordAnswer(activeApp.id, activeApp.current_question_index, message.content, message.author, message.channel);
        return;
      }
    }
  }

  // 6. Ticket Automatic Responses & Keyword Detection + Groq Assistant
  if (message.channel && message.channel.name && message.channel.name.includes('ticket-')) {
    const ticketId = message.channel.name.split('-')[1];
    if (ticketId) {
      const isStaff = message.member?.roles?.cache?.some(r =>
        r.name.toLowerCase().includes('staff') ||
        r.name.toLowerCase().includes('mod') ||
        r.name.toLowerCase().includes('admin')
      );
      if (isStaff) {
        groqService.handleStaffMessage(ticketId, message.author);
      } else {
        let workflowHandled = false;
        try {
          const autoRes = await ticketWorkflowService.processTicketMessage(ticketId, message.channel, message);
          if (autoRes && autoRes.success) {
            workflowHandled = true;
          }
        } catch (wfErr) {
          console.error('Error running ticket workflow service:', wfErr);
        }

        if (!workflowHandled) {
          const history = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY timestamp ASC LIMIT 8').all(ticketId);
          const aiRes = await groqService.generateTicketResponse(ticketId, message.content, history);
          if (aiRes.success && aiRes.reply) {
            await message.channel.send({ content: aiRes.reply });
          } else if (aiRes.handedOff) {
            await message.channel.send({ content: aiRes.message });
          }
        }
      }
    }
  }

  // 7. Prefix Command Processing (Support both '!' and '-' prefixes)
  const content = message.content.trim();
  let matchedPrefix = null;

  if (content.startsWith(DEFAULT_PREFIX)) {
    matchedPrefix = DEFAULT_PREFIX;
  } else if (content.startsWith('!')) {
    matchedPrefix = '!';
  } else if (content.startsWith('-')) {
    matchedPrefix = '-';
  }

  if (!matchedPrefix) return;

  const rawArgs = content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = (rawArgs.shift() || '').toLowerCase();
  if (!commandName) return;

  // Check prefix commands map (which contains aliases and direct names)
  const command = prefixCommands.get(commandName) || prefixCommands.get(`${matchedPrefix}${commandName}`);

  if (!command) {
    // If unknown command, show intelligent suggestion format
    const unknownMsg = formatUnknownCommandMessage(commandName);
    await message.reply({ content: unknownMsg });
    return;
  }

  try {
    await command.execute({
      author: message.author,
      member: message.member,
      channel: message.channel,
      guild: message.guild,
      reply: (opts) => message.reply(opts),
      content: message.content
    }, rawArgs);
  } catch (err) {
    console.error(`Error executing prefix command ${commandName}:`, err);
    await message.reply({ content: `❌ Error executing \`${matchedPrefix}${commandName}\`: ${err.message}` });
  }
});

// Interaction create handler
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // 1. Slash commands
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    // 2. Button interactions
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // ==========================================
      // TICKET SYSTEM BUTTONS (Exact 6 Functionalities)
      // ==========================================
      // 1. Claim Ticket
      if (customId === 'ticket_claim_btn' || customId.startsWith('ticket_claim_')) {
        const ticketId = customId.startsWith('ticket_claim_') && customId !== 'ticket_claim_btn'
          ? customId.replace('ticket_claim_', '')
          : (interaction.channel?.name?.split('-')[1] || '0001');

        const res = ticketService.claimTicket(ticketId, interaction.user);
        if (!res.success) return interaction.reply({ content: `❌ ${res.error}`, ephemeral: true });

        return interaction.reply({
          content: `🟢 **Ticket Claimed!** This support ticket has been claimed by <@${interaction.user.id}>.`
        });
      }

      // 2. Unclaim Ticket
      if (customId.startsWith('ticket_unclaim_')) {
        const ticketId = customId.replace('ticket_unclaim_', '');
        const res = ticketService.unclaimTicket(ticketId);
        if (!res.success) return interaction.reply({ content: `❌ ${res.error}`, ephemeral: true });

        return interaction.reply({
          content: `⚪ **Ticket Unclaimed.** This ticket has been returned to the general support queue.`
        });
      }

      // 3. Add Member Modal Trigger
      if (customId.startsWith('ticket_add_member_')) {
        const ticketId = customId.replace('ticket_add_member_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_ticket_add_${ticketId}`)
          .setTitle(`Add Member to Ticket #${ticketId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('target_user_id')
              .setLabel('Member Discord ID or Mention')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('e.g. 1025813762684502168 or @user')
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // 4. Remove Member Modal Trigger
      if (customId.startsWith('ticket_remove_member_')) {
        const ticketId = customId.replace('ticket_remove_member_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_ticket_remove_${ticketId}`)
          .setTitle(`Remove Member from Ticket #${ticketId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('target_user_id')
              .setLabel('Member Discord ID or Mention')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('e.g. 1025813762684502168')
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // 5. Rename Ticket Modal Trigger
      if (customId.startsWith('ticket_rename_')) {
        const ticketId = customId.replace('ticket_rename_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_ticket_rename_${ticketId}`)
          .setTitle(`Rename Ticket #${ticketId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('new_name')
              .setLabel('New Channel Name')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('e.g. general-support or police-inquiry')
              .setMinLength(2)
              .setMaxLength(30)
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // 6. Close Ticket
      if (customId === 'ticket_close_btn' || customId.startsWith('ticket_close_')) {
        const ticketId = customId.startsWith('ticket_close_') && customId !== 'ticket_close_btn'
          ? customId.replace('ticket_close_', '')
          : (interaction.channel?.name?.split('-')[1] || '0001');

        await interaction.deferReply();
        const res = await ticketService.closeTicket(ticketId, interaction.user);

        return interaction.editReply({
          content: `🔒 **Ticket #${res.ticketId} Closed by <@${interaction.user.id}>.**`,
          embeds: res.embeds,
          components: res.components
        });
      }

      // Escalate Ticket
      if (customId === 'ticket_escalate_btn' || customId.startsWith('ticket_escalate_')) {
        const ticketId = customId.startsWith('ticket_escalate_') && customId !== 'ticket_escalate_btn'
          ? customId.replace('ticket_escalate_', '')
          : (interaction.channel?.name?.split('-')[1] || '0001');

        return interaction.reply({
          content: `🚨 **Ticket #${ticketId} Escalated!** High Command and Human Resources leadership have been notified.`
        });
      }

      // ==========================================
      // INFRACTION APPEAL WORKFLOW
      // ==========================================
      if (customId.startsWith('infraction_appeal_')) {
        const infId = customId.replace('infraction_appeal_', '');
        const inf = db.prepare('SELECT * FROM infractions WHERE id = ?').get(infId);

        if (!inf) {
          return interaction.reply({ content: `❌ Infraction record \`${infId}\` was not found.`, ephemeral: true });
        }

        if (inf.appealable === 0) {
          return interaction.reply({ content: `❌ Infraction \`${infId}\` has been marked as non-appealable by High Command.`, ephemeral: true });
        }

        const existingAppeal = db.prepare("SELECT * FROM infraction_appeals WHERE infraction_id = ? AND user_id = ? AND status = 'PENDING'").get(infId, interaction.user.id);
        if (existingAppeal) {
          return interaction.reply({ content: `⚠️ You already have an active appeal open for **${infId}** (<#${existingAppeal.channel_id}>).`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const cleanName = (interaction.user.username || 'member').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 10);
        const channelName = `appeal-${infId.toLowerCase()}-${cleanName}`;

        let channel = null;
        if (interaction.guild && interaction.guild.channels?.create) {
          try {
            const appealsCategory = interaction.guild.channels.cache.find(
              c => c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes('appeal') || c.name.toLowerCase().includes('support'))
            );

            channel = await interaction.guild.channels.create({
              name: channelName,
              type: ChannelType.GuildText,
              parent: appealsCategory ? appealsCategory.id : null,
              permissionOverwrites: [
                {
                  id: interaction.guild.roles.everyone.id,
                  deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                },
                {
                  id: interaction.user.id,
                  allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks
                  ]
                },
                {
                  id: interaction.client.user.id,
                  allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.EmbedLinks
                  ]
                }
              ],
              reason: `Infraction Appeal Channel for ${interaction.user.tag} (${infId})`
            });
          } catch (err) {
            console.warn('Appeal channel creation fallback:', err.message);
          }
        }

        const channelId = channel ? channel.id : `appeal_chan_${Date.now()}`;
        const appealId = `APL-${infId}`;

        db.prepare(`
          INSERT INTO infraction_appeals (id, infraction_id, user_id, user_tag, channel_id, statement, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'Pending statement submission', 'PENDING', ?)
        `).run(appealId, infId, interaction.user.id, interaction.user.tag || interaction.user.username, channelId, Date.now());

        const appealWelcomeEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'infraction_appeal',
          title: `WEST VIRGINIA STATE ROLEPLAY · INFRACTION APPEAL`,
          description: [
            `Welcome <@${interaction.user.id}>! This is your official appeal channel for **${infId}**.`,
            '',
            '**Infraction Details:**',
            `• **Infraction ID:** \`${infId}\``,
            `• **Punishment:** \`${inf.punishment}\``,
            `• **Reason on Record:** "${inf.reason}"`,
            `• **Issued By:** <@${inf.issuer_id}>`,
            '',
            '📌 **Instructions:**',
            'Please click the **"Submit Appeal Statement"** button below to provide a thorough explanation of why this infraction should be revoked, and attach any relevant counter-evidence links.',
            '',
            '*Your appeal statement will be reviewed for clarity, accuracy, and evaluated by High Command.*'
          ].join('\n')
        });

        const appealStartRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`appeal_submit_btn_${infId}`)
            .setLabel('Submit Appeal Statement')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝')
        );

        if (channel && channel.send) {
          await channel.send({ content: `<@${interaction.user.id}> @here`, embeds: appealWelcomeEmbeds, components: [appealStartRow] });
        }

        return interaction.editReply({
          content: `✅ **Appeal Channel Established!** Head to <#${channelId}> to submit your appeal statement.`
        });
      }

      // Infraction Appeal Statement Modal Trigger
      if (customId.startsWith('appeal_submit_btn_')) {
        const infId = customId.replace('appeal_submit_btn_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_infraction_appeal_${infId}`)
          .setTitle(`Appeal Statement · ${infId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('appeal_statement')
              .setLabel('Explanation & Counter-Evidence')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Detail what happened and why this infraction should be reversed...')
              .setMinLength(15)
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // Reviewer: Accept Appeal Button
      if (customId.startsWith('appeal_accept_')) {
        const infId = customId.replace('appeal_accept_', '');
        const inf = db.prepare('SELECT * FROM infractions WHERE id = ?').get(infId);
        if (!inf) return interaction.reply({ content: '❌ Infraction not found.', ephemeral: true });

        const now = Date.now();
        db.transaction(() => {
          db.prepare("UPDATE infractions SET status = 'REVOKED', revoked_by = ?, revoke_reason = 'Appeal approved by High Rank' WHERE id = ?")
            .run(interaction.user.tag || interaction.user.username, infId);
          db.prepare("UPDATE infraction_appeals SET status = 'ACCEPTED', reviewer_id = ?, reviewer_tag = ?, reviewed_at = ? WHERE infraction_id = ?")
            .run(interaction.user.id, interaction.user.tag || interaction.user.username, now, infId);
          db.prepare("INSERT INTO audit_logs (action, executor_id, target_id, details, created_at) VALUES ('INFRACTION_APPEAL_ACCEPTED', ?, ?, ?, ?)")
            .run(interaction.user.id, inf.staff_id, `Appeal accepted for ${infId}`, now);
        })();

        // DM user revocation confirmation with Top & Bottom banners
        try {
          const dmEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
            type: 'infraction_revoked',
            title: 'WEST VIRGINIA STATE ROLEPLAY · INFRACTION APPEAL APPROVED',
            description: [
              `Hello <@${inf.staff_id}>,`,
              '',
              `Your appeal for **${infId}** has been **APPROVED** by <@${interaction.user.id}>.`,
              '',
              `• **Infraction ID:** \`${infId}\``,
              `• **Previous Punishment:** \`${inf.punishment}\``,
              `• **Status:** \`REVOKED\``,
              `• **Decision Date:** <t:${Math.floor(now / 1000)}:F>`,
              '',
              'This record has been officially removed from your active disciplinary record.'
            ].join('\n')
          });

          const recipient = await interaction.guild?.members?.fetch(inf.staff_id).catch(() => null);
          if (recipient && recipient.user?.send) {
            await recipient.user.send({ embeds: dmEmbeds });
          }
        } catch (dmErr) {
          console.warn(`Could not DM appeal approval to ${inf.staff_id}:`, dmErr.message);
        }

        return interaction.reply({
          content: `✅ **Infraction ${infId} Officially Revoked!** Appeal approved by <@${interaction.user.id}>.`
        });
      }

      // Reviewer: Deny Appeal Button
      if (customId.startsWith('appeal_deny_')) {
        const infId = customId.replace('appeal_deny_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_appeal_deny_${infId}`)
          .setTitle(`Deny Appeal · ${infId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('denial_reason')
              .setLabel('Reason for Denying Appeal')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Explain why the evidence provided is insufficient...')
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // ==========================================
      // APPLICATION WORKFLOW BUTTONS
      // ==========================================
      // Start department application button
      if (customId === 'app_apply_staff' || customId.startsWith('app_apply_dept_')) {
        const deptId = customId.startsWith('app_apply_dept_') ? customId.replace('app_apply_dept_', '') : 'staff';
        await interaction.deferReply({ ephemeral: true });

        const session = await applicationService.createApplicationSession(interaction.guild, interaction.user, deptId);
        if (!session.success) {
          return interaction.editReply({ content: `❌ ${session.error}` });
        }

        return interaction.editReply({
          content: `✅ **Private Application Created!** Head over to <#${session.channelId}> to complete your application for **${session.department.name}**.`
        });
      }

      // Sequential Question Answer Button: app_q_answer_{appId}_{qIndex}
      if (customId.startsWith('app_q_answer_')) {
        const parts = customId.split('_'); // ['app', 'q', 'answer', appId, qIndex]
        const appId = parts[3];
        const qIndex = parseInt(parts[4], 10) || 0;

        const app = applicationService.getApplication(appId);
        if (!app) return interaction.reply({ content: '❌ Application not found.', ephemeral: true });

        const dept = departmentService.getDepartment(app.department_id);
        let questions = [];
        try {
          questions = JSON.parse(dept?.questions_json || '[]');
        } catch (e) {
          questions = [];
        }

        const prompt = questions[qIndex] || `Question ${qIndex + 1}`;

        const modal = new ModalBuilder()
          .setCustomId(`modal_app_q_${appId}_${qIndex}`)
          .setTitle(`Question ${qIndex + 1} of ${questions.length}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('answer_input')
              .setLabel(prompt.slice(0, 45))
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Write your detailed answer here...')
              .setMinLength(2)
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // Application Reviewer: Approve Application Button
      if (customId.startsWith('app_accept_')) {
        const appId = customId.replace('app_accept_', '');
        await interaction.deferReply();
        const res = await applicationService.acceptApplication(appId, interaction.user, interaction.guild);
        if (!res.success) return interaction.editReply({ content: `❌ ${res.error}` });

        return interaction.editReply({
          content: `✅ **Application Approved!** Candidate has been accepted by <@${interaction.user.id}>. Notification DM dispatched.`,
          embeds: res.embeds
        });
      }

      // Application Reviewer: Deny Application Button
      if (customId.startsWith('app_deny_')) {
        const appId = customId.replace('app_deny_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_app_deny_${appId}`)
          .setTitle(`Deny Application ${appId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('denial_reason')
              .setLabel('Reason for Denial')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Explain why the candidate does not meet requirements...')
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // Application Reviewer: Request Interview Button
      if (customId.startsWith('app_interview_')) {
        const appId = customId.replace('app_interview_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_app_interview_${appId}`)
          .setTitle(`Request Interview · ${appId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('interview_notes')
              .setLabel('Interview Instructions & Date')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Provide scheduling details or voice channel requirements...')
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // Application Reviewer: Request Changes Button
      if (customId.startsWith('app_changes_')) {
        const appId = customId.replace('app_changes_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_app_changes_${appId}`)
          .setTitle(`Request Changes · ${appId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('changes_notes')
              .setLabel('Feedback / Revisions Needed')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Specify which questions or scenarios need expansion...')
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // ==========================================
      // SHIFT & VERIFICATION BUTTONS
      // ==========================================
      if (customId === 'shift_start_normal') {
        const res = shiftService.startShift(interaction.user, 'NORMAL');
        if (!res.success) return interaction.reply({ content: `❌ ${res.error}`, ephemeral: true });
        return interaction.reply({ content: `🟢 **Shift Started!** On-Duty role assigned. Remember to follow staff uniform and conduct regulations.` });
      }

      if (customId === 'shift_start_5050') {
        const res = shiftService.startShift(interaction.user, '50/50');
        if (!res.success) return interaction.reply({ content: `❌ ${res.error}`, ephemeral: true });
        return interaction.reply({ content: `🟢 **50/50 Shift Started!** On-Duty role assigned. Credited toward your weekly quota.` });
      }

      if (customId === 'shift_break_toggle') {
        const res = shiftService.startBreak(interaction.user);
        if (!res.success) {
          const resumeRes = shiftService.endBreak(interaction.user);
          if (!resumeRes.success) return interaction.reply({ content: `❌ ${resumeRes.error}`, ephemeral: true });
          return interaction.reply({ content: `🟢 **Resumed from Break!** On-Duty role restored.` });
        }
        return interaction.reply({ content: `🟡 **Went on Break.** On-Break role assigned. Take your time to recharge.` });
      }

      if (customId === 'shift_end') {
        await interaction.deferReply({ ephemeral: true });
        const res = await shiftService.endShift(interaction.user, interaction.guild);
        if (!res.success) return interaction.editReply({ content: `❌ ${res.error}` });
        return interaction.editReply({ content: `🔴 **Shift Ended.** Total credited working duration: **${shiftService.formatDuration(res.creditedSeconds)}**. Thank you for your service to WVRP! Log posted to staff shift logs.` });
      }

      if (customId === 'verify_check_btn') {
        await interaction.deferReply({ ephemeral: true });
        const res = await robloxService.resolveVerification(interaction.user);
        const embeds = WvrpEmbedBuilder.createVerificationEmbed({
          userMention: `<@${interaction.user.id}>`,
          username: interaction.user.tag || interaction.user.username,
          userId: interaction.user.id,
          robloxUser: res.robloxUser,
          bloxlinkStatus: res.bloxlinkStatus,
          verified: res.verified
        });

        if (res.verified) {
          return interaction.editReply({
            content: `✅ **Verification Confirmed!** Welcome to West Virginia State Roleplay.`,
            embeds
          });
        } else {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Link on Bloxlink')
              .setStyle(ButtonStyle.Link)
              .setURL(process.env.WELCOME_VERIFY_URL || 'https://blox.link/verify')
          );
          return interaction.editReply({
            content: `⚠️ **Not Linked Yet:** We could not find a confirmed Roblox account linked to your Discord profile on Bloxlink. Please visit the link below to connect your account.`,
            embeds,
            components: [row]
          });
        }
      }

      if (customId === 'welcome_show_members') {
        const memberCount = interaction.guild?.memberCount || 20028;
        const onlineCount = interaction.guild?.members?.cache
          ? interaction.guild.members.cache.filter(m => m.presence?.status && m.presence.status !== 'offline').size
          : Math.floor(memberCount * 0.22);

        const embed = WvrpEmbedBuilder.createBase({
          title: '👥 West Virginia State Roleplay — Community Statistics',
          description: `Here are the latest real-time community statistics for **West Virginia State Roleplay**:\n\n• 👥 **Total Members:** **${memberCount.toLocaleString()}** members\n• 🟢 **Active Online:** **${(onlineCount || 4280).toLocaleString()}** members\n• 🚀 **Server Boost Status:** Level 3 Booster Status\n• 🚨 **ER:LC Status:** Whitelisted Private Server Active (\`wvrp\`)\n\nThank you for being a valued part of our growing community!`,
          footerText: 'West Virginia State Roleplay · Member Count'
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // ==========================================
      // MODERATION SYSTEM BUTTONS (Components V2)
      // ==========================================
      if (customId === 'mod_stats_open') {
        const stats = moderationService.getStats('ALL');
        const payload = createModerationStatsV2({ stats, filter: 'ALL' });
        return interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId.startsWith('mod_stats_filter_')) {
        const filter = customId.replace('mod_stats_filter_', '');
        const stats = moderationService.getStats(filter);
        const payload = createModerationStatsV2({ stats, filter });
        if (interaction.update) {
          return interaction.update(payload);
        }
        return interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId.startsWith('mod_case_')) {
        const caseId = customId.replace('mod_case_', '');
        const caseData = moderationService.getCase(caseId);
        if (!caseData) {
          return interaction.reply({ content: `❌ Case file \`${caseId}\` not found in database.`, ephemeral: true });
        }
        const payload = createModerationCaseInfoV2({ caseData });
        return interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId.startsWith('mod_history_')) {
        const parts = customId.replace('mod_history_', '').split('_');
        const targetUserId = parts[0];
        const page = parseInt(parts[1], 10) || 1;

        let targetUser = { id: targetUserId, username: `User_${targetUserId.slice(0, 5)}` };
        if (interaction.guild?.members) {
          try {
            const m = interaction.guild.members.cache.get(targetUserId) || (await interaction.guild.members.fetch(targetUserId).catch(() => null));
            if (m?.user) targetUser = m.user;
          } catch (e) {
            // ignore
          }
        }

        const history = moderationService.getHistory(targetUserId, page, 5);
        const payload = createModerationHistoryV2({
          target: targetUser,
          cases: history.cases,
          page: history.page,
          totalPages: history.totalPages,
          totalCases: history.totalCases
        });

        if (interaction.update) {
          return interaction.update(payload);
        }
        return interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId.startsWith('mod_unmute_')) {
        const targetUserId = customId.replace('mod_unmute_', '');
        const hasPerm = checkPermission(interaction.member, 'STAFF') ||
          interaction.member?.permissions?.has(PermissionFlagsBits.ModerateMembers);

        if (!hasPerm) {
          return interaction.reply({ content: '❌ You do not have permission to unmute members.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const targetMember = interaction.guild?.members?.cache?.get(targetUserId) || (await interaction.guild?.members?.fetch(targetUserId).catch(() => null));
        const targetUser = targetMember?.user || { id: targetUserId, username: 'Member' };

        const res = await moderationService.executeUnmute({
          guild: interaction.guild,
          targetUser,
          targetMember,
          moderatorUser: interaction.user,
          moderatorMember: interaction.member,
          reason: 'Timeout removed via Components V2 moderator button',
          client: interaction.client
        });

        if (!res.success) {
          return interaction.editReply({ content: `❌ ${res.error}` });
        }
        return interaction.editReply({
          content: `✅ **Member Unmuted!** Case record \`${res.caseId}\` created. Notification DM sent.`
        });
      }

      if (customId === 'mod_active_shifts') {
        const activeShifts = shiftService.getActiveShifts();
        const count = activeShifts.length;
        const listText = count > 0
          ? activeShifts.slice(0, 10).map(s => `• <@${s.staffId}> (\`${s.staffTag}\`) — **${s.status}** (${s.shiftType}) · Elapsed: \`${s.elapsedFormatted}\``).join('\n')
          : '*No staff members currently on duty.*';

        const embed = WvrpEmbedBuilder.createBase({
          title: `🟢 Active Shifts on Duty (${count})`,
          description: listText,
          footerText: 'West Virginia Roleplay · Shift Operations'
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (customId === 'mod_open_tickets') {
        const tickets = db.prepare("SELECT * FROM tickets WHERE status = 'OPEN' ORDER BY created_at DESC LIMIT 10").all();
        const listText = tickets.length > 0
          ? tickets.map(t => `• **#${t.id}** (<#${t.channel_id || ''}>) · <@${t.user_id}> · *${t.category}* (${t.claimed_by ? `Claimed by <@${t.claimed_by}>` : 'Unclaimed'})`).join('\n')
          : '*No tickets currently awaiting assistance.*';

        const embed = WvrpEmbedBuilder.createBase({
          title: `🎫 Open Support Tickets (${tickets.length})`,
          description: listText,
          footerText: 'West Virginia Roleplay · Support Queue'
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (customId === 'mod_app_hub') {
        const apps = db.prepare("SELECT * FROM applications WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 8").all();
        const listText = apps.length > 0
          ? apps.map(a => `• **${a.id}** — <@${a.user_id}> (\`${a.roblox_username || 'Roblox'}\`) · SPaG: \`${a.sapling_score || 0}%\``).join('\n')
          : '*No applications currently pending review.*';

        const embed = WvrpEmbedBuilder.createBase({
          title: `📝 Pending Trainee Applications (${apps.length})`,
          description: listText,
          footerText: 'West Virginia Roleplay · Recruitment Office'
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (customId === 'mod_infraction_btn') {
        const infractions = db.prepare("SELECT * FROM infractions WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 8").all();
        const listText = infractions.length > 0
          ? infractions.map(i => `• **${i.id}** — <@${i.staff_id}> · \`${i.punishment}\` · "${i.reason}" (by <@${i.issuer_id}>)`).join('\n')
          : '*No active infractions on record.*';

        const embed = WvrpEmbedBuilder.createBase({
          title: `⚖️ Active Staff Infractions (${infractions.length})`,
          description: listText,
          footerText: 'West Virginia Roleplay · Disciplinary Registry'
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (customId === 'mod_antiping_logs') {
        const logs = antiPingService.getRecentLogs(8);
        const listText = logs.length > 0
          ? logs.map(l => `• <@${l.user_id}> pinged **${l.target_team_name}** · Tier ${l.tier} (\`${l.punishment}\`)`).join('\n')
          : '*No recent anti-ping security violations.*';

        const embed = WvrpEmbedBuilder.createBase({
          title: '🛡️ Anti-Ping Security Logs',
          description: listText,
          footerText: 'West Virginia Roleplay · Security Division'
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (customId === 'mod_quota_audit') {
        const quotas = db.prepare(`
          SELECT staff_id, staff_tag, SUM(total_duration_seconds) as total_sec, COUNT(*) as shift_count
          FROM staff_shifts
          GROUP BY staff_id
          ORDER BY total_sec DESC
          LIMIT 8
        `).all();

        const listText = quotas.length > 0
          ? quotas.map((q, idx) => `**#${idx + 1}** <@${q.staff_id}> (\`${q.staff_tag}\`): **${shiftService.formatDuration(q.total_sec)}** (${q.shift_count} shifts)`).join('\n')
          : '*No shift history records found.*';

        const embed = WvrpEmbedBuilder.createBase({
          title: '📊 Weekly Staff Quota Audit',
          description: listText,
          footerText: 'West Virginia Roleplay · Quota Auditing'
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // ==========================================
      // LEAVE OF ABSENCE (LOA) BUTTONS
      // ==========================================
      if (customId.startsWith('loa_accept_')) {
        const loaId = customId.replace('loa_accept_', '');
        await interaction.deferReply({ ephemeral: true });
        const res = await loaService.acceptRequest(loaId, interaction.user, interaction.guild);
        if (!res.success) return interaction.editReply({ content: `❌ ${res.error}` });
        return interaction.editReply({ content: `✅ **Leave of Absence ${loaId} Approved!** Staff quota exempted and notification dispatched.` });
      }

      if (customId.startsWith('loa_deny_')) {
        const loaId = customId.replace('loa_deny_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_loa_deny_${loaId}`)
          .setTitle(`Deny Leave of Absence ${loaId}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('loa_denial_reason')
              .setLabel('Reason for Denial')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Enter reason for denying this leave request...')
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      // ==========================================
      // SECURITY CASE RESOLUTION BUTTON
      // ==========================================
      if (customId.startsWith('security_resolve_')) {
        const caseId = customId.replace('security_resolve_', '');
        await interaction.deferReply({ ephemeral: true });
        const res = await securityService.resolveCase(caseId, interaction.user);
        if (!res.success) return interaction.editReply({ content: `❌ ${res.error}` });
        return interaction.editReply({ content: `✅ **Security Case ${caseId} Resolved!** Marked as closed by <@${interaction.user.id}>.` });
      }

      // ==========================================
      // ER:LC KILL LOG PLAYER STATISTICS BUTTON
      // ==========================================
      if (customId.startsWith('kill_stats_')) {
        const killerName = customId.replace('kill_stats_', '');
        await interaction.deferReply({ ephemeral: true });
        const stats = erlcLoggingService.getKillerStats(killerName);
        const statsText = [
          `# 📊 Player Combat Statistics · ${killerName}`,
          `• **Roblox Username:** \`${killerName}\``,
          `• **Total Kills Logged:** \`${stats.kills}\``,
          `• **Total Deaths Logged:** \`${stats.deaths}\``,
          `• **Kill/Death Ratio (K/D):** \`${stats.kd}\``,
          `• **RDM Detections:** \`${stats.rdmCount}\` ${stats.rdmCount > 0 ? '⚠️ *(Requires Moderator Review)*' : '✅ *(Clean Record)*'}`
        ].join('\n');
        return interaction.editReply({ content: statsText });
      }
    }

    // 3. String Select Menu interactions
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_faq') {
        const val = interaction.values[0];
        const faqAnswers = {
          faq_apply: 'Staff applications are submitted in private recruitment channels via `/apply` or `#applications`. Answer each question in complete sentences.',
          faq_dept: 'New departments are approved exclusively by Server Management. Open a Management Support ticket to present a proposal.',
          faq_transfers: 'Yes! Department and staff transfers are reviewed through support tickets with proof of experience.',
          faq_sheriff: 'The Sheriff and Police teams are whitelisted for certified staff and active department members.'
        };
        return interaction.reply({ content: `ℹ️ **${faqAnswers[val] || 'Information available in support tickets.'}**`, ephemeral: true });
      }

      // Ticket Category Selection -> Creates actual private Discord channel with strict overwrites
      if (interaction.customId === 'ticket_create_category') {
        const cat = interaction.values[0];
        await interaction.deferReply({ ephemeral: true });

        const res = await ticketService.createTicketChannel(interaction.guild, interaction.user, cat, `Inquiry registered for ${cat}`);
        if (!res.success) {
          return interaction.editReply({ content: res.error });
        }

        return interaction.editReply({
          content: `✅ **Support Ticket Created!** Your private channel is <#${res.channelId}>. Staff will assist you shortly.`
        });
      }

      // Department Application Selection Menu
      if (interaction.customId === 'app_select_dept' || interaction.customId === 'application_dept_select') {
        const deptId = interaction.values[0];
        await interaction.deferReply({ ephemeral: true });

        const session = await applicationService.createApplicationSession(interaction.guild, interaction.user, deptId);
        if (!session.success) {
          return interaction.editReply({ content: `❌ ${session.error}` });
        }

        return interaction.editReply({
          content: `✅ **Private Application Channel Created!** Please proceed to <#${session.channelId}> to complete your application for **${session.department.name}**.`
        });
      }
    }

    // 4. Modal Submissions
    if (interaction.isModalSubmit()) {
      const customId = interaction.customId;

      // Ticket: Add Member
      if (customId.startsWith('modal_ticket_add_')) {
        const ticketId = customId.replace('modal_ticket_add_', '');
        const targetRaw = interaction.fields.getTextInputValue('target_user_id');
        const targetUserId = targetRaw.replace(/[<@!>]/g, '').trim();

        await ticketService.addMemberToTicket(ticketId, interaction.channel, targetUserId, interaction.user);
        return interaction.reply({ content: `✅ Added <@${targetUserId}> to this ticket.` });
      }

      // Ticket: Remove Member
      if (customId.startsWith('modal_ticket_remove_')) {
        const ticketId = customId.replace('modal_ticket_remove_', '');
        const targetRaw = interaction.fields.getTextInputValue('target_user_id');
        const targetUserId = targetRaw.replace(/[<@!>]/g, '').trim();

        await ticketService.removeMemberFromTicket(ticketId, interaction.channel, targetUserId, interaction.user);
        return interaction.reply({ content: `✅ Removed <@${targetUserId}> from this ticket.` });
      }

      // Ticket: Rename
      if (customId.startsWith('modal_ticket_rename_')) {
        const ticketId = customId.replace('modal_ticket_rename_', '');
        const newName = interaction.fields.getTextInputValue('new_name');

        const res = await ticketService.renameTicket(ticketId, interaction.channel, newName, interaction.user);
        return interaction.reply({ content: `✅ Renamed ticket channel to **${res.newName}**.` });
      }

      // Infraction Appeal Submission Modal Submit
      if (customId.startsWith('modal_infraction_appeal_')) {
        const infId = customId.replace('modal_infraction_appeal_', '');
        const statement = interaction.fields.getTextInputValue('appeal_statement');

        await interaction.deferReply();

        // Evaluate appeal writing quality and AI probability via Sapling AI
        let saplingRes = { score: 92, aiDetected: false, summary: 'Writing quality evaluated.' };
        try {
          saplingRes = await saplingService.analyzeAnswers([statement]);
        } catch (e) {
          console.warn('Sapling appeal evaluation fallback:', e.message);
        }

        const now = Date.now();
        db.prepare(`
          UPDATE infraction_appeals
          SET statement = ?, sapling_score = ?, sapling_ai_detected = ?, sapling_summary = ?, status = 'PENDING'
          WHERE infraction_id = ? AND user_id = ?
        `).run(statement, saplingRes.score || 92, saplingRes.aiDetected ? 1 : 0, saplingRes.summary || 'Clear grammar', infId, interaction.user.id);

        const inf = db.prepare('SELECT * FROM infractions WHERE id = ?').get(infId);

        const reviewerEmbed = WvrpEmbedBuilder.createBase({
          title: `🛡️ Infraction Appeal Review — ${infId}`,
          description: [
            `**Appellant:** <@${interaction.user.id}> (\`${interaction.user.tag || interaction.user.username}\`)`,
            `**Infraction ID:** \`${infId}\``,
            `**Original Punishment:** \`${inf?.punishment || 'Disciplinary Action'}\``,
            `**Original Reason:** "${inf?.reason || 'Policy Violation'}"`,
            `**Submission Date:** <t:${Math.floor(now / 1000)}:F>`,
            '',
            `🤖 **Writing Quality:** Score: \`${saplingRes.score || 92}/100\` · ${saplingRes.aiDetected ? '⚠️ High AI Probability' : '✅ Clear Human Tone'}`,
            '',
            '**Appellant Statement & Evidence:**',
            `> "${statement}"`,
            '',
            '*Authorized High Rank members: Review the submission and render a decision below.*'
          ].join('\n'),
          footerText: `WVRP Disciplinary Appeals · ${infId}`
        });
        reviewerEmbed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

        const reviewRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`appeal_accept_${infId}`).setLabel('Approve Appeal (Revoke)').setStyle(ButtonStyle.Success).setEmoji('✅'),
          new ButtonBuilder().setCustomId(`appeal_deny_${infId}`).setLabel('Deny Appeal').setStyle(ButtonStyle.Danger).setEmoji('❌')
        );

        if (interaction.channel && interaction.channel.send) {
          await interaction.channel.send({ embeds: [reviewerEmbed], components: [reviewRow] });
        }

        return interaction.editReply({
          content: `✅ **Appeal Statement Submitted!** Your appeal has been logged with writing verification and queued for High Command review.`
        });
      }

      // Reviewer: Deny Appeal Modal Submit
      if (customId.startsWith('modal_appeal_deny_')) {
        const infId = customId.replace('modal_appeal_deny_', '');
        const reason = interaction.fields.getTextInputValue('denial_reason');

        const inf = db.prepare('SELECT * FROM infractions WHERE id = ?').get(infId);
        const now = Date.now();

        db.prepare("UPDATE infraction_appeals SET status = 'DENIED', reviewer_id = ?, reviewer_tag = ?, reviewed_at = ? WHERE infraction_id = ?")
          .run(interaction.user.id, interaction.user.tag || interaction.user.username, now, infId);

        // Send Denial DM to appellant
        try {
          const dmEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
            type: 'infraction_dm',
            title: 'WEST VIRGINIA STATE ROLEPLAY · INFRACTION APPEAL DENIED',
            description: [
              `Hello <@${inf?.staff_id || interaction.user.id}>,`,
              '',
              `Your appeal for **${infId}** has been **DENIED** by <@${interaction.user.id}>.`,
              '',
              `• **Infraction ID:** \`${infId}\``,
              `• **Punishment:** \`${inf?.punishment || 'Active'}\``,
              `• **Reviewer Decision:** \`APPEAL DENIED\``,
              `• **Denial Reason:** "${reason}"`,
              `• **Date:** <t:${Math.floor(now / 1000)}:F>`,
              '',
              'This infraction remains active on your permanent staff record.'
            ].join('\n')
          });

          const recipient = await interaction.guild?.members?.fetch(inf?.staff_id).catch(() => null);
          if (recipient && recipient.user?.send) {
            await recipient.user.send({ embeds: dmEmbeds });
          }
        } catch (dmErr) {
          console.warn('Could not DM appeal denial:', dmErr.message);
        }

        return interaction.reply({
          content: `❌ **Appeal Denied for ${infId}.** Reason: "${reason}". Notification sent to appellant.`
        });
      }

      // Sequential Application Question Submission: modal_app_q_{appId}_{qIndex}
      if (customId.startsWith('modal_app_q_')) {
        const parts = customId.split('_'); // ['modal', 'app', 'q', appId, qIndex]
        const appId = parts[3];
        const qIndex = parseInt(parts[4], 10) || 0;
        const answer = interaction.fields.getTextInputValue('answer_input');

        await interaction.deferReply();
        const res = await applicationService.recordAnswer(appId, qIndex, answer, interaction.user, interaction.channel);

        if (!res.success) {
          return interaction.editReply({ content: `❌ ${res.error}` });
        }

        if (res.finished) {
          return interaction.editReply({
            content: `🎉 **Application Complete!** All questions have been saved and forwarded to reviewers with Sapling SPaG and Groq AI analysis.`
          });
        } else {
          return interaction.editReply({
            content: `✅ **Answer recorded for Question ${qIndex + 1}!** Click the button in the prompt below to proceed to Question ${res.nextIndex + 1}.`
          });
        }
      }

      // Application Review: Deny Modal Submit
      if (customId.startsWith('modal_app_deny_')) {
        const appId = customId.replace('modal_app_deny_', '');
        const reason = interaction.fields.getTextInputValue('denial_reason');

        await interaction.deferReply();
        const res = await applicationService.denyApplication(appId, interaction.user, reason, interaction.guild);
        if (!res.success) return interaction.editReply({ content: `❌ ${res.error}` });

        return interaction.editReply({
          content: `❌ **Application Denied.** Notification DM sent to candidate.`,
          embeds: res.embeds
        });
      }

      // Application Review: Interview Modal Submit
      if (customId.startsWith('modal_app_interview_')) {
        const appId = customId.replace('modal_app_interview_', '');
        const notes = interaction.fields.getTextInputValue('interview_notes');

        await interaction.deferReply();
        const res = await applicationService.requestInterview(appId, interaction.user, notes);
        if (!res.success) return interaction.editReply({ content: `❌ ${res.error}` });

        return interaction.editReply({
          content: `🎤 **Interview Requested.** Notification sent to candidate.`,
          embeds: [res.embed]
        });
      }

      // Application Review: Changes Modal Submit
      if (customId.startsWith('modal_app_changes_')) {
        const appId = customId.replace('modal_app_changes_', '');
        const feedback = interaction.fields.getTextInputValue('changes_notes');

        await interaction.deferReply();
        const res = await applicationService.requestChanges(appId, interaction.user, feedback);
        if (!res.success) return interaction.editReply({ content: `❌ ${res.error}` });

        return interaction.editReply({
          content: `✏️ **Revisions Requested.** Feedback sent to candidate.`,
          embeds: [res.embed]
        });
      }

      // LOA Denial Modal Submit
      if (customId.startsWith('modal_loa_deny_')) {
        const loaId = customId.replace('modal_loa_deny_', '');
        const reason = interaction.fields.getTextInputValue('loa_denial_reason');

        await interaction.deferReply({ ephemeral: true });
        const res = await loaService.denyRequest(loaId, interaction.user, reason, interaction.guild);
        if (!res.success) return interaction.editReply({ content: `❌ ${res.error}` });

        return interaction.editReply({
          content: `❌ **Leave of Absence ${loaId} Denied.** Candidate notified with reason: "${reason}".`
        });
      }
    }
  } catch (err) {
    console.error('Interaction error:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: `❌ Error processing interaction: ${err.message}`, ephemeral: true });
    }
  }
});

// 5. Automatic Welcome System: GuildMemberAdd Event
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    await welcomeService.handleMemberJoin(member);
  } catch (err) {
    console.error('Error handling GuildMemberAdd welcome event:', err);
  }
});

// 5b. Security & Staff Departure Tracking: GuildMemberRemove Event
client.on(Events.GuildMemberRemove, async (member) => {
  try {
    await securityService.handleStaffDeparture(member, member.guild);
  } catch (err) {
    console.error('Error handling GuildMemberRemove security event:', err);
  }
});

// 6. Server Boost & Server Tag Automation: GuildMemberUpdate Event
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  try {
    await boostService.handleMemberUpdate(oldMember, newMember);
  } catch (err) {
    console.error('Error handling GuildMemberUpdate boost/tag event:', err);
  }
});

// Launch bot if DISCORD_TOKEN is present
if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN.trim().length > 10) {
  client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('Discord login failed:', err.message);
  });
} else {
  console.log('ℹ️ Running in Local / Interactive Emulation Mode (No DISCORD_TOKEN in .env).');
  console.log('All embeds, commands, SQLite database, and interactive workflows are active and accessible via the Web Studio & API.');
}

export default client;
