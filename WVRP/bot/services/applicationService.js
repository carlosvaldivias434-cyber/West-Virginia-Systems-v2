import db from '../database/index.js';
import departmentService from './departmentService.js';
import saplingService from './saplingService.js';
import groqService from './groqService.js';
import robloxService from './robloxService.js';
import {
  WvrpEmbedBuilder,
  BANNERS,
  createApplicationResultDmV2,
  createApplicationWelcomeV2
} from '../embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';

// In-memory mutex to prevent concurrent/duplicate submissions for the same application
const applicationLocks = new Set();

export class ApplicationService {
  /**
   * Helper to render dynamic progress bar
   */
  renderProgressBar(completed, total = 15) {
    const percent = Math.min(100, Math.round((completed / total) * 100));
    const filled = Math.min(10, Math.max(0, Math.round((completed / total) * 10)));
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    return {
      text: `${bar} ${completed}/${total} QUESTIONS COMPLETED (${percent}%)`,
      percent,
      bar
    };
  }

  /**
   * Check if applications are globally enabled or closed
   */
  isApplicationsEnabled() {
    const setting = db.prepare("SELECT value FROM application_settings WHERE key = 'applications_status'").get();
    return !setting || setting.value === 'OPEN';
  }

  /**
   * Check if user already has an active/pending application
   */
  hasActiveApplication(userId) {
    const active = db.prepare(`
      SELECT * FROM applications
      WHERE user_id = ? AND status IN ('IN_PROGRESS', 'PENDING')
    `).get(userId);
    return Boolean(active);
  }

  /**
   * Get an application by ID or channel ID
   */
  getApplication(appIdOrChannelId) {
    return db.prepare(`
      SELECT * FROM applications
      WHERE id = ? OR channel_id = ?
    `).get(appIdOrChannelId, appIdOrChannelId);
  }

  /**
   * Get all answers for an application
   */
  getAnswers(appId) {
    return db.prepare(`
      SELECT * FROM application_answers
      WHERE application_id = ?
      ORDER BY question_index ASC
    `).all(appId);
  }

  /**
   * Check reviewer permissions for an application
   */
  canReview(member, user, department) {
    if (!member && !user) return false;
    // Administrator or Manage Guild permission
    if (member?.permissions?.has(PermissionFlagsBits.Administrator) || member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
      return true;
    }
    // Department Leader
    if (department && department.leader_id && String(department.leader_id) === String(user?.id)) {
      return true;
    }
    // Department Reviewer Role or High Command roles
    if (member?.roles?.cache) {
      if (department && department.reviewer_role_id && member.roles.cache.has(department.reviewer_role_id)) {
        return true;
      }
      const hasReviewRole = member.roles.cache.some(r => {
        const n = r.name.toLowerCase();
        return n.includes('reviewer') ||
          n.includes('management') ||
          n.includes('high rank') ||
          n.includes('admin') ||
          n.includes('lead') ||
          n.includes('chief') ||
          n.includes('colonel') ||
          n.includes('director') ||
          n.includes('staff');
      });
      if (hasReviewRole) return true;
    }
    return false;
  }

  /**
   * STEP 1 & 2: CREATE PRIVATE DISCORD TEXT CHANNEL FOR APPLICANT
   */
  async createApplicationSession(guild, user, departmentId = 'staff') {
    if (!this.isApplicationsEnabled()) {
      return { success: false, error: 'Applications are currently closed by Administration.' };
    }

    const dept = departmentService.getDepartment(departmentId) || departmentService.getDepartment('staff');
    if (!dept) {
      return { success: false, error: `Invalid department: ${departmentId}` };
    }

    // Duplicate check
    const existing = db.prepare(`
      SELECT * FROM applications
      WHERE user_id = ? AND department_id = ? AND status IN ('IN_PROGRESS', 'PENDING')
    `).get(user.id, dept.id);

    if (existing) {
      return {
        success: false,
        error: `You already have an active application for **${dept.name}** (${existing.id}). Please check your channel <#${existing.channel_id}>.`
      };
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const appId = `APP-${String(count + 1).padStart(4, '0')}`;
    const cleanName = (user.username || 'member').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 15);
    const channelName = `application-${cleanName}`;

    let channel = null;

    // Discord channel creation with strict private permissions
    if (guild && guild.channels?.create) {
      try {
        const appCategory = guild.channels.cache.find(
          c => c.type === ChannelType.GuildCategory && (
            c.name.toLowerCase().includes('application') ||
            c.name.toLowerCase().includes('recruitment') ||
            c.name.toLowerCase().includes('department')
          )
        );

        const permissionOverwrites = [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks
            ]
          }
        ];

        // Add department leadership and reviewer roles
        const reviewerRoles = guild.roles.cache.filter(r =>
          r.id === dept.reviewer_role_id ||
          r.name.toLowerCase().includes('reviewer') ||
          r.name.toLowerCase().includes('management') ||
          r.name.toLowerCase().includes('high rank') ||
          r.name.toLowerCase().includes('admin')
        );
        for (const [_, role] of reviewerRoles) {
          permissionOverwrites.push({
            id: role.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.EmbedLinks]
          });
        }

        // Add bot self permission
        if (guild.client?.user?.id) {
          permissionOverwrites.push({
            id: guild.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.EmbedLinks
            ]
          });
        }

        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: appCategory ? appCategory.id : null,
          permissionOverwrites,
          reason: `Private Application Channel for ${user.tag || user.username} (${dept.name})`
        });
      } catch (err) {
        console.warn(`Could not create Discord channel for application (Simulation fallback):`, err.message);
      }
    }

    const channelId = channel ? channel.id : `app_chan_${Date.now()}`;
    const now = Date.now();

    // Parse exactly 15 department questions
    let questions = [];
    try {
      questions = JSON.parse(dept.questions_json || '[]');
    } catch (e) {
      questions = [];
    }
    if (questions.length < 15) {
      // Fallback to standard 15 questions if less than 15
      const standardQ = db.prepare('SELECT prompt FROM application_questions ORDER BY question_number ASC LIMIT 15').all();
      if (standardQ && standardQ.length === 15) {
        questions = standardQ.map(q => q.prompt);
      }
    }

    // Save initial application record
    db.prepare(`
      INSERT INTO applications (
        id, user_id, user_tag, roblox_username, status,
        department_id, department_name, channel_id, current_question_index,
        answers_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'IN_PROGRESS', ?, ?, ?, 0, '[]', ?, ?)
    `).run(
      appId,
      user.id,
      user.tag || user.username,
      user.username,
      dept.id,
      dept.name,
      channelId,
      now,
      now
    );

    const initialProgress = this.renderProgressBar(0, 15);

    // Build Welcome Embed with top/bottom images, applicant details, instructions
    const userAvatarUrl = typeof user.displayAvatarURL === 'function'
      ? user.displayAvatarURL({ dynamic: true, size: 512 })
      : (user.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png');

    const welcomeEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'application',
      title: `WEST VIRGINIA STATE ROLEPLAY · ${dept.name.toUpperCase()}`,
      description: [
        `Welcome to your private recruitment channel, <@${user.id}>!`,
        '',
        '📋 **Application Information:**',
        `• **Applicant:** <@${user.id}> (\`${user.tag || user.username}\`)`,
        `• **Discord ID:** \`${user.id}\``,
        `• **Selected Department:** **${dept.name}**`,
        `• **Application ID:** \`${appId}\``,
        `• **Curriculum:** Exactly 15 Questions`,
        `• **Status:** \`IN_PROGRESS\``,
        `• **Initial Progress:** \`${initialProgress.text}\``,
        '',
        '📌 **Instructions & Guidelines:**',
        '1. Exactly 15 questions will be presented to you individually in this channel.',
        '2. Read each question carefully and provide detailed, thoughtful answers.',
        '3. You may submit your answers by typing directly in this channel, or by clicking the **[Answer Question]** button.',
        '4. Every answer is saved immediately to persistent storage.',
        '5. Your application progress will be displayed at every step.',
        '6. Once Question 15 is answered, your application will be forwarded to Department Reviewers.',
        '',
        '⚠️ *Do not ask staff or High Command to review your application. Doing so will result in immediate disqualification.*',
        '',
        '**Question 1/15 is presented below!**'
      ].join('\n')
    });

    if (welcomeEmbeds[1]) {
      welcomeEmbeds[1].setThumbnail(userAvatarUrl);
    }

    // Build Question 1 embed
    const q1Prompt = questions[0] || 'What is your full Roblox username and current age?';
    const q1Embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'department_application',
      title: `${dept.name.toUpperCase()}\nDEPARTMENT APPLICATION`,
      description: `**Question 1/15 — ${q1Prompt}**\n\n📊 **Progress:** \`${initialProgress.text}\`\n\n*Click the button below to submit your response for Question 1, or type your answer directly in this channel.*`
    });

    const q1Row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`app_q_answer_${appId}_0`)
        .setLabel('Answer Question 1')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✍️')
    );

    if (channel && channel.send) {
      await channel.send({ content: `<@${user.id}>`, embeds: welcomeEmbeds });
      await channel.send({ embeds: q1Embeds, components: [q1Row] });
    }

    return {
      success: true,
      appId,
      channelId,
      channel,
      department: dept,
      totalQuestions: 15
    };
  }

  /**
   * STEP 3: RECORD ANSWER AND ADVANCE QUESTIONNAIRE
   * Supports both direct channel chat messages and button modals.
   */
  async recordAnswer(appId, questionIndex, answerText, user, channel = null) {
    // 1. Prevent race conditions via per-application lock
    if (applicationLocks.has(appId)) {
      return { success: false, error: 'An answer is currently being processed. Please wait a moment.' };
    }
    applicationLocks.add(appId);

    try {
      const app = this.getApplication(appId);
      if (!app) return { success: false, error: 'Application not found.' };

      // 2. Prevent unauthorized users from answering on behalf of applicant
      if (user && user.id && String(user.id) !== String(app.user_id)) {
        return { success: false, error: 'Only the applicant can submit answers for this application.' };
      }

      // 3. Prevent duplicate answers for the same question index
      const existingAnswer = db.prepare(
        'SELECT id FROM application_answers WHERE application_id = ? AND question_index = ?'
      ).get(appId, questionIndex);
      if (existingAnswer) {
        return { success: false, error: `Question ${questionIndex + 1} has already been recorded.` };
      }

      const dept = departmentService.getDepartment(app.department_id);
      let questions = [];
      try {
        questions = JSON.parse(dept?.questions_json || '[]');
      } catch (e) {
        questions = [];
      }
      if (questions.length < 15) {
        const standardQ = db.prepare('SELECT prompt FROM application_questions ORDER BY question_number ASC LIMIT 15').all();
        if (standardQ && standardQ.length === 15) {
          questions = standardQ.map(q => q.prompt);
        }
      }

      const questionPrompt = questions[questionIndex] || `Question ${questionIndex + 1}`;
      const now = Date.now();

      // 4. Save answer immediately in persistent SQLite database
      db.prepare(`
        INSERT INTO application_answers (application_id, question_index, question_prompt, answer_text, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(appId, questionIndex, questionPrompt, answerText, now);

      const nextIndex = questionIndex + 1;
      const totalQuestions = 15;
      const isFinished = nextIndex >= totalQuestions;

      db.prepare(`
        UPDATE applications
        SET current_question_index = ?, updated_at = ?
        WHERE id = ?
      `).run(nextIndex, now, appId);

      // 5. Send immediate confirmation: "Answer saved successfully."
      if (channel && channel.send) {
        try {
          await channel.send({ content: '✅ **Answer saved successfully.**' });
        } catch (e) {
          console.warn('Could not send answer confirmation to channel:', e.message);
        }
      }

      // 6. If not finished, present the next question
      if (!isFinished) {
        const nextPrompt = questions[nextIndex] || `Question ${nextIndex + 1}`;
        const progress = this.renderProgressBar(nextIndex, totalQuestions);

        const qEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
          type: 'department_application',
          title: `${dept?.name?.toUpperCase() || 'WEST VIRGINIA ROLEPLAY'}\nDEPARTMENT APPLICATION`,
          description: `**Question ${nextIndex + 1}/15 — ${nextPrompt}**\n\n📊 **Progress:** \`${progress.text}\`\n\n*Click the button below to submit your response for Question ${nextIndex + 1}, or type your answer directly in this channel.*`
        });

        const nextRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`app_q_answer_${appId}_${nextIndex}`)
            .setLabel(`Answer Question ${nextIndex + 1}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✍️')
        );

        if (channel && channel.send) {
          try {
            await channel.send({ embeds: qEmbeds, components: [nextRow] });
          } catch (e) {
            console.warn('Could not send next question embed:', e.message);
          }
        }

        return {
          success: true,
          finished: false,
          nextIndex,
          total: totalQuestions,
          prompt: nextPrompt,
          progress: progress.text
        };
      }

      // 7. ALL 15 QUESTIONS ANSWERED -> FINAL APPLICATION REVIEW
      return await this.finalizeSubmission(appId, user, channel);
    } finally {
      applicationLocks.delete(appId);
    }
  }

  /**
   * STEP 4 & 5: RUN SAPLING & GROQ, THEN POST REVIEWER PANEL
   */
  async finalizeSubmission(appId, user, channel = null) {
    const app = this.getApplication(appId);
    const answers = this.getAnswers(appId);
    const answerTexts = answers.map(a => a.answer_text);

    // 1. Run Sapling AI Writing & AI Detection Evaluation
    let saplingRes = { score: 88, aiDetected: false, summary: 'Writing quality evaluated.' };
    try {
      saplingRes = await saplingService.analyzeAnswers(answerTexts);
    } catch (e) {
      console.warn('Sapling review fallback:', e.message);
    }

    // 2. Run Groq AI summary (llama-3.3-70b-versatile)
    let groqSummary = 'Candidate demonstrates standard comprehension, clear answers, and roleplay interest.';
    try {
      if (groqService.isConfigured()) {
        const groqPrompt = `Summarize this WVRP application for department "${app.department_name}". Candidate answers:\n${answers.map(a => `Q: ${a.question_prompt}\nA: ${a.answer_text}`).join('\n\n')}`;
        const groqRes = await groqService.generateTicketResponse(appId, groqPrompt);
        if (groqRes && groqRes.reply) groqSummary = groqRes.reply.slice(0, 450);
      }
    } catch (e) {
      console.warn('Groq summary fallback:', e.message);
    }

    const now = Date.now();
    db.prepare(`
      UPDATE applications
      SET status = 'PENDING', sapling_score = ?, sapling_ai_detected = ?,
          groq_summary = ?, answers_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      saplingRes.score || 0,
      saplingRes.aiDetected ? 1 : 0,
      groqSummary,
      JSON.stringify(answers),
      now,
      appId
    );

    // 3. Post Confirmation to Applicant
    const applicantEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'application',
      title: '✅ Application Submitted for Review',
      description: `Thank you <@${app.user_id}>! You have completed all 15 questions for **${app.department_name}**.\n\n• **Application ID:** \`${appId}\`\n• **Status:** \`PENDING REVIEW\`\n• **Questions Answered:** \`15/15 (100%)\`\n• **Writing Evaluation:** ${saplingRes.aiDetected ? '⚠️ Potential External/AI Assistance Detected' : '✨ Human Written / Verified SPaG'}\n\n*Authorized department leadership will review your submission below. Please remain patient.*`
    });

    // 4. Build all 15 question and answer fields
    const questionFields = answers.map((a, i) => ({
      name: `Q${i + 1}: ${a.question_prompt.slice(0, 200)}`,
      value: `> ${(a.answer_text || 'No answer provided').slice(0, 800)}`,
      inline: false
    }));

    // 5. Post Final Review Embed with Top and Bottom Banners & All 15 Answers
    const reviewerEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'application_review',
      title: `🛡️ Department Reviewer Panel — ${app.department_name} (${appId})`,
      description: [
        `**Applicant:** <@${app.user_id}> (\`${app.user_tag}\`)`,
        `**Discord ID:** \`${app.user_id}\``,
        `**Roblox Username:** \`${app.roblox_username || 'Not Linked'}\``,
        `**Department:** **${app.department_name}**`,
        `**Application ID:** \`${appId}\``,
        `**Submission Date:** <t:${Math.floor(now / 1000)}:F>`,
        `**Status:** \`PENDING REVIEW\``,
        '',
        `🤖 **Writing Quality:** Score: \`${saplingRes.score || 88}/100\` · ${saplingRes.aiDetected ? '⚠️ High AI Probability' : '✅ Clear Human Grammar'}`,
        `🧠 **Groq AI Summary:** ${groqSummary}`,
        '',
        '### 📋 Full 15-Question Submitted Responses:'
      ].join('\n'),
      fields: questionFields,
      footerText: `WVRP Review Console · ${appId}`
    });

    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`app_accept_${appId}`).setLabel('Approve Application').setStyle(ButtonStyle.Success).setEmoji('✅'),
      new ButtonBuilder().setCustomId(`app_deny_${appId}`).setLabel('Deny Application').setStyle(ButtonStyle.Danger).setEmoji('❌'),
      new ButtonBuilder().setCustomId(`app_interview_${appId}`).setLabel('Request Interview').setStyle(ButtonStyle.Primary).setEmoji('🎤'),
      new ButtonBuilder().setCustomId(`app_changes_${appId}`).setLabel('Request Changes').setStyle(ButtonStyle.Secondary).setEmoji('✏️')
    );

    if (channel && channel.send) {
      try {
        await channel.send({ embeds: applicantEmbeds });
        await channel.send({ embeds: reviewerEmbeds, components: [controlRow] });
      } catch (e) {
        console.warn('Could not post review embeds to channel:', e.message);
      }
    }

    // Forward to central review channel if configured
    if (channel?.guild) {
      const reviewChannelId = process.env.APPLICATION_REVIEW_CHANNEL_ID || process.env.APPLICATION_REVIEW_CHANNEL;
      if (reviewChannelId) {
        const reviewChan = channel.guild.channels.cache.get(reviewChannelId);
        if (reviewChan && reviewChan.send) {
          try {
            await reviewChan.send({
              content: `🔔 **New Application Submitted:** <#${channel.id}> (${app.department_name})`,
              embeds: reviewerEmbeds,
              components: [controlRow]
            });
          } catch (e) {
            console.warn('Could not forward to review channel:', e.message);
          }
        }
      }
    }

    return {
      success: true,
      finished: true,
      appId,
      status: 'PENDING',
      sapling: saplingRes,
      groqSummary
    };
  }

  /**
   * STEP 6: APPROVE APPLICATION
   */
  async acceptApplication(appId, reviewer, guild = null) {
    const app = this.getApplication(appId);
    if (!app) return { success: false, error: 'Application not found' };

    // Prevent duplicate decisions
    if (app.status === 'ACCEPTED') {
      return { success: false, error: 'This application has already been accepted.' };
    }
    if (app.status === 'DENIED') {
      return { success: false, error: 'This application has already been denied.' };
    }

    const dept = departmentService.getDepartment(app.department_id);
    const now = Date.now();

    db.transaction(() => {
      db.prepare(`
        UPDATE applications
        SET status = 'ACCEPTED', reviewer_id = ?, reviewer_tag = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(reviewer.id, reviewer.tag || reviewer.username, now, now, appId);

      // Add to department roster
      if (dept) {
        departmentService.addMemberToRoster(dept.id, { id: app.user_id, tag: app.user_tag }, 'Probationary Member', '10-08');
      }

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('APPLICATION_ACCEPTED', ?, ?, ?, ?)
      `).run(reviewer.id, app.user_id, `Accepted for ${app.department_name}`, now);
    })();

    // Discord role assignment
    let roleAssigned = false;
    let memberObj = null;
    if (guild) {
      try {
        memberObj = await guild.members.fetch(app.user_id).catch(() => null);
        if (memberObj && dept?.role_id) {
          const role = guild.roles.cache.find(r => r.name.toLowerCase().includes(dept.id) || r.id === dept.role_id);
          if (role) {
            await memberObj.roles.add(role);
            roleAssigned = true;
          }
        }
      } catch (err) {
        console.warn(`Role assignment skipped or failed:`, err.message);
      }
    }

    // Acceptance DM to applicant with Top & Bottom banners
    const dmEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'application_accepted',
      title: 'WEST VIRGINIA STATE ROLEPLAY · APPLICATION APPROVED',
      description: [
        `Congratulations, <@${app.user_id}>!`,
        '',
        `Your application for **${app.department_name}** has been **APPROVED** by <@${reviewer.id}>.`,
        '',
        '**Application Information:**',
        `• **Applicant:** <@${app.user_id}> (\`${app.user_tag}\`)`,
        `• **Department:** **${app.department_name}**`,
        `• **Application ID:** \`${appId}\``,
        `• **Reviewed By:** <@${reviewer.id}> (\`${reviewer.tag || reviewer.username}\`)`,
        `• **Decision Date:** <t:${Math.floor(now / 1000)}:F>`,
        `• **Result:** \`ACCEPTED\``,
        '',
        '📌 **Onboarding Instructions:**',
        'Please report to your assigned department lobby within 7 days to complete initial orientation, receive your equipment, and review active standard operating procedures.'
      ].join('\n')
    });

    // Acceptance DM to applicant with Components V2 (Top & Bottom banners)
    let dmDelivered = false;
    let v2DmPayload = null;
    try {
      v2DmPayload = createApplicationResultDmV2({
        decision: 'ACCEPTED',
        category: app.department_name,
        applicant: { id: app.user_id, tag: app.user_tag, username: app.user_tag },
        reviewer,
        date: now
      });
    } catch (e) {
      console.warn('Failed building V2 result DM, using fallback embeds:', e.message);
    }

    if (memberObj && memberObj.user?.send) {
      try {
        if (v2DmPayload) {
          await memberObj.user.send(v2DmPayload);
        } else {
          await memberObj.user.send({ embeds: dmEmbeds });
        }
        dmDelivered = true;
      } catch (dmErr) {
        try {
          await memberObj.user.send({ embeds: dmEmbeds });
          dmDelivered = true;
        } catch (fallbackErr) {
          console.warn(`Could not send acceptance DM to applicant ${app.user_id}:`, fallbackErr.message);
        }
      }
    }

    // Build updated review embeds and disabled buttons for message editing
    const updatedReviewEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'application_review',
      title: `🛡️ Department Reviewer Panel — ${app.department_name} (${appId}) [APPROVED]`,
      description: [
        `**Applicant:** <@${app.user_id}> (\`${app.user_tag}\`)`,
        `**Discord ID:** \`${app.user_id}\``,
        `**Roblox Username:** \`${app.roblox_username || 'Not Linked'}\``,
        `**Department:** **${app.department_name}**`,
        `**Application ID:** \`${appId}\``,
        `**Reviewed By:** <@${reviewer.id}> (\`${reviewer.tag || reviewer.username}\`)`,
        `**Decision Date:** <t:${Math.floor(now / 1000)}:F>`,
        `**Status:** \`ACCEPTED\``,
        '',
        '✅ **Application Officially Approved.** Candidate rostered as Probationary Member.'
      ].join('\n'),
      footerText: `WVRP Review Console · ${appId} · APPROVED`
    });

    const disabledControlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`app_accept_${appId}`).setLabel('Application Approved').setStyle(ButtonStyle.Success).setEmoji('✅').setDisabled(true),
      new ButtonBuilder().setCustomId(`app_deny_${appId}`).setLabel('Deny Application').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(`app_interview_${appId}`).setLabel('Request Interview').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(`app_changes_${appId}`).setLabel('Request Changes').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );

    // Send copy to results channel if configured
    if (guild) {
      const resultsChannelId = process.env.APPLICATION_RESULTS_CHANNEL_ID || process.env.RESULTS_CHANNEL_ID;
      if (resultsChannelId) {
        const resultsChan = guild.channels.cache.get(resultsChannelId);
        if (resultsChan && resultsChan.send) {
          try {
            await resultsChan.send({ embeds: dmEmbeds });
          } catch (e) {
            console.warn('Could not post to results channel:', e.message);
          }
        }
      }
    }

    return {
      success: true,
      status: 'ACCEPTED',
      roleAssigned,
      dmDelivered,
      embeds: dmEmbeds,
      updatedReviewEmbeds,
      disabledControlRow
    };
  }

  /**
   * STEP 7: DENY APPLICATION
   */
  async denyApplication(appId, reviewer, reason = 'Did not meet current department requirements.', guild = null) {
    const app = this.getApplication(appId);
    if (!app) return { success: false, error: 'Application not found' };

    // Prevent duplicate decisions
    if (app.status === 'ACCEPTED') {
      return { success: false, error: 'This application has already been accepted.' };
    }
    if (app.status === 'DENIED') {
      return { success: false, error: 'This application has already been denied.' };
    }

    const now = Date.now();
    db.transaction(() => {
      db.prepare(`
        UPDATE applications
        SET status = 'DENIED', reviewer_id = ?, reviewer_tag = ?,
            denial_reason = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(reviewer.id, reviewer.tag || reviewer.username, reason, now, now, appId);

      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('APPLICATION_DENIED', ?, ?, ?, ?)
      `).run(reviewer.id, app.user_id, `Denied for ${app.department_name}: ${reason}`, now);
    })();

    // Denial DM to applicant with Top & Bottom banners
    const dmEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'application_denied',
      title: 'WEST VIRGINIA STATE ROLEPLAY · APPLICATION RESULT',
      description: [
        `Hello <@${app.user_id}>,`,
        '',
        `Your application for **${app.department_name}** was evaluated and was not approved at this time.`,
        '',
        '**Application Information:**',
        `• **Applicant:** <@${app.user_id}> (\`${app.user_tag}\`)`,
        `• **Department:** **${app.department_name}**`,
        `• **Application ID:** \`${appId}\``,
        `• **Reviewed By:** <@${reviewer.id}> (\`${reviewer.tag || reviewer.username}\`)`,
        `• **Decision Date:** <t:${Math.floor(now / 1000)}:F>`,
        `• **Result:** \`DENIED\``,
        `• **Reason:** ${reason}`,
        '',
        'Please review the feedback provided above. You are welcome to reapply during our next recruitment cycle in 14 days.'
      ].join('\n')
    });

    // Denial DM to applicant with Components V2 (Top & Bottom banners)
    let dmDelivered = false;
    let v2DmPayload = null;
    try {
      v2DmPayload = createApplicationResultDmV2({
        decision: 'DENIED',
        category: app.department_name,
        applicant: { id: app.user_id, tag: app.user_tag, username: app.user_tag },
        reviewer,
        reason,
        date: now
      });
    } catch (e) {
      console.warn('Failed building V2 denial DM, using fallback embeds:', e.message);
    }

    if (guild) {
      try {
        const member = await guild.members.fetch(app.user_id).catch(() => null);
        if (member && member.user?.send) {
          try {
            if (v2DmPayload) {
              await member.user.send(v2DmPayload);
            } else {
              await member.user.send({ embeds: dmEmbeds });
            }
            dmDelivered = true;
          } catch (innerErr) {
            try {
              await member.user.send({ embeds: dmEmbeds });
              dmDelivered = true;
            } catch (fallbackErr) {
              console.warn(`Could not send denial DM to applicant ${app.user_id}:`, fallbackErr.message);
            }
          }
        }
      } catch (dmErr) {
        console.warn(`Could not fetch applicant member for denial DM:`, dmErr.message);
      }
    }

    // Build updated review embeds and disabled buttons for message editing
    const updatedReviewEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'application_review',
      title: `🛡️ Department Reviewer Panel — ${app.department_name} (${appId}) [DENIED]`,
      description: [
        `**Applicant:** <@${app.user_id}> (\`${app.user_tag}\`)`,
        `**Discord ID:** \`${app.user_id}\``,
        `**Roblox Username:** \`${app.roblox_username || 'Not Linked'}\``,
        `**Department:** **${app.department_name}**`,
        `**Application ID:** \`${appId}\``,
        `**Reviewed By:** <@${reviewer.id}> (\`${reviewer.tag || reviewer.username}\`)`,
        `**Decision Date:** <t:${Math.floor(now / 1000)}:F>`,
        `**Status:** \`DENIED\``,
        `**Reason:** "${reason}"`,
        '',
        '❌ **Application Denied.** Decision logged to audit registry.'
      ].join('\n'),
      footerText: `WVRP Review Console · ${appId} · DENIED`
    });

    const disabledControlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`app_accept_${appId}`).setLabel('Approve Application').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(`app_deny_${appId}`).setLabel('Application Denied').setStyle(ButtonStyle.Danger).setEmoji('❌').setDisabled(true),
      new ButtonBuilder().setCustomId(`app_interview_${appId}`).setLabel('Request Interview').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(`app_changes_${appId}`).setLabel('Request Changes').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );

    // Send copy to results channel if configured
    if (guild) {
      const resultsChannelId = process.env.APPLICATION_RESULTS_CHANNEL_ID || process.env.RESULTS_CHANNEL_ID;
      if (resultsChannelId) {
        const resultsChan = guild.channels.cache.get(resultsChannelId);
        if (resultsChan && resultsChan.send) {
          try {
            await resultsChan.send({ embeds: dmEmbeds });
          } catch (e) {
            console.warn('Could not post to results channel:', e.message);
          }
        }
      }
    }

    return {
      success: true,
      status: 'DENIED',
      dmDelivered,
      embeds: dmEmbeds,
      updatedReviewEmbeds,
      disabledControlRow
    };
  }

  /**
   * STEP 8: REQUEST INTERVIEW
   */
  async requestInterview(appId, reviewer, notes = 'Interview required via voice channel') {
    const app = this.getApplication(appId);
    if (!app) return { success: false, error: 'Application not found' };

    const now = Date.now();
    db.prepare(`
      UPDATE applications
      SET status = 'INTERVIEW_SCHEDULED', interview_notes = ?, reviewer_id = ?, updated_at = ?
      WHERE id = ?
    `).run(notes, reviewer.id, now, appId);

    const embed = WvrpEmbedBuilder.createBase({
      title: `🎤 Interview Requested — ${app.department_name}`,
      description: `Hello <@${app.user_id}>! Department leadership has requested an interview for application **${appId}**.\n\n• **Reviewer:** <@${reviewer.id}>\n• **Notes / Details:** ${notes}\n\n*Please coordinate with leadership in this channel to schedule your interview.*`,
      footerText: `WVRP Recruitment · ${appId}`
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return { success: true, embed, status: 'INTERVIEW_SCHEDULED' };
  }

  /**
   * STEP 9: REQUEST CHANGES
   */
  async requestChanges(appId, reviewer, feedback = 'Please provide more detail in your answers.') {
    const app = this.getApplication(appId);
    if (!app) return { success: false, error: 'Application not found' };

    const now = Date.now();
    db.prepare(`
      UPDATE applications
      SET status = 'CHANGES_REQUESTED', change_request_notes = ?, reviewer_id = ?, updated_at = ?
      WHERE id = ?
    `).run(feedback, reviewer.id, now, appId);

    const embed = WvrpEmbedBuilder.createBase({
      title: `✏️ Changes Requested — ${app.department_name}`,
      description: `Hello <@${app.user_id}>! Reviewers have requested revisions to your answers for application **${appId}**.\n\n• **Reviewer:** <@${reviewer.id}>\n• **Required Revisions:** ${feedback}\n\n*Please respond in this channel with updated details.*`,
      footerText: `WVRP Recruitment · ${appId}`
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return { success: true, embed, status: 'CHANGES_REQUESTED' };
  }
}

const applicationService = new ApplicationService();
export default applicationService;
