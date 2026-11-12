import {
  EmbedBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageFlags
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

export const EMBED_COLOR = process.env.EMBED_COLOR || '#00A8FF';
const BASE_HOST = process.env.PUBLIC_URL || 'https://wvrp-assets.local';

/**
 * Transforms relative paths or handles full URLs safely so Discord.js EmbedBuilder never throws validation errors.
 */
export const safeUrl = (p) => {
  if (!p || typeof p !== 'string' || p.trim().length === 0) return null;
  const trimmed = p.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('attachment://')) {
    return trimmed;
  }
  return `${BASE_HOST}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

/**
 * Default fallback SVGs generated locally in /public/banners/
 */
export const DEFAULT_LOCAL_BANNERS = {
  TOP: safeUrl('/banners/wvrp-banner-top.svg'),
  BOTTOM: safeUrl('/banners/wvrp-banner-bottom.svg'),
  ASSISTANCE: safeUrl('/banners/banner-assistance.svg'),
  APPLICATIONS: safeUrl('/banners/banner-applications.svg'),
  MARKETPLACE: safeUrl('/banners/banner-marketplace.svg'),
  REGULATIONS: safeUrl('/banners/banner-regulations.svg'),
  SESSIONS: safeUrl('/banners/banner-sessions.svg'),
  INFRACTIONS: safeUrl('/banners/banner-infractions.svg'),
  PROMOTIONS: safeUrl('/banners/banner-promotions.svg'),
  DEPARTMENTS: safeUrl('/banners/banner-departments.svg'),
  TRAINING: safeUrl('/banners/banner-training.svg'),
  FEEDBACK: safeUrl('/banners/banner-feedback.svg'),
  DASHBOARD: safeUrl('/banners/banner-dashboard.svg'),
  WELCOME: safeUrl('/banners/banner-welcome.svg'),
  BOOST: safeUrl('/banners/banner-boost.svg'),
  VERIFICATION: safeUrl('/banners/banner-verification.svg'),
  FASTPASS: safeUrl('/banners/banner-fastpass.svg')
};

export const BANNERS = DEFAULT_LOCAL_BANNERS;

/**
 * Banner Hierarchy Mapping
 * Each type maps to:
 * - specificTopEnv: Env var for this exact message type
 * - systemTopEnv: Env var for the overall system
 * - specificBottomEnv: Env var for this exact message type
 * - systemBottomEnv: Env var for the overall system
 * - defaultTop: Local default SVG fallback
 * - defaultBottom: Local default SVG fallback
 */
export const BANNER_MAPPINGS = {
  // MARKETPLACE
  marketplace: {
    systemTopEnv: 'MARKETPLACE_TOP_BANNER_URL',
    systemBottomEnv: 'MARKETPLACE_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.MARKETPLACE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  marketplace_tos: {
    specificTopEnv: 'MARKETPLACE_TOS_TOP_BANNER_URL',
    specificBottomEnv: 'MARKETPLACE_TOS_BOTTOM_BANNER_URL',
    systemTopEnv: 'MARKETPLACE_TOP_BANNER_URL',
    systemBottomEnv: 'MARKETPLACE_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.MARKETPLACE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  marketplace_order: {
    specificTopEnv: 'MARKETPLACE_ORDER_TOP_BANNER_URL',
    specificBottomEnv: 'MARKETPLACE_ORDER_BOTTOM_BANNER_URL',
    systemTopEnv: 'MARKETPLACE_TOP_BANNER_URL',
    systemBottomEnv: 'MARKETPLACE_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.MARKETPLACE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  marketplace_result: {
    specificTopEnv: 'MARKETPLACE_RESULT_TOP_BANNER_URL',
    specificBottomEnv: 'MARKETPLACE_RESULT_BOTTOM_BANNER_URL',
    systemTopEnv: 'MARKETPLACE_TOP_BANNER_URL',
    systemBottomEnv: 'MARKETPLACE_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.MARKETPLACE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // STAFF DASHBOARD / INFORMATION
  staff_dashboard: {
    specificTopEnv: 'STAFF_DASHBOARD_TOP_BANNER_URL',
    specificBottomEnv: 'STAFF_DASHBOARD_BOTTOM_BANNER_URL',
    systemTopEnv: 'STAFF_INFORMATION_TOP_BANNER_URL',
    systemBottomEnv: 'STAFF_INFORMATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DASHBOARD,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  staff_information: {
    systemTopEnv: 'STAFF_INFORMATION_TOP_BANNER_URL',
    systemBottomEnv: 'STAFF_INFORMATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DASHBOARD,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  staff_feedback: {
    specificTopEnv: 'STAFF_FEEDBACK_TOP_BANNER_URL',
    specificBottomEnv: 'STAFF_FEEDBACK_BOTTOM_BANNER_URL',
    systemTopEnv: 'STAFF_INFORMATION_TOP_BANNER_URL',
    systemBottomEnv: 'STAFF_INFORMATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.FEEDBACK,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  staff_activity: {
    specificTopEnv: 'STAFF_ACTIVITY_TOP_BANNER_URL',
    specificBottomEnv: 'STAFF_ACTIVITY_BOTTOM_BANNER_URL',
    systemTopEnv: 'STAFF_INFORMATION_TOP_BANNER_URL',
    systemBottomEnv: 'STAFF_INFORMATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DASHBOARD,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // STAFF INFRACTIONS
  infraction: {
    systemTopEnv: 'INFRACTION_TOP_BANNER_URL',
    systemBottomEnv: 'INFRACTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.INFRACTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  infraction_dm: {
    specificTopEnv: 'INFRACTION_DM_TOP_BANNER_URL',
    specificBottomEnv: 'INFRACTION_DM_BOTTOM_BANNER_URL',
    systemTopEnv: 'INFRACTION_TOP_BANNER_URL',
    systemBottomEnv: 'INFRACTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.INFRACTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  infraction_appeal: {
    specificTopEnv: 'INFRACTION_APPEAL_TOP_BANNER_URL',
    specificBottomEnv: 'INFRACTION_APPEAL_BOTTOM_BANNER_URL',
    systemTopEnv: 'INFRACTION_TOP_BANNER_URL',
    systemBottomEnv: 'INFRACTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.INFRACTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  infraction_revoked: {
    specificTopEnv: 'INFRACTION_REVOKED_TOP_BANNER_URL',
    specificBottomEnv: 'INFRACTION_REVOKED_BOTTOM_BANNER_URL',
    systemTopEnv: 'INFRACTION_TOP_BANNER_URL',
    systemBottomEnv: 'INFRACTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.INFRACTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  infraction_evidence: {
    specificTopEnv: 'INFRACTION_EVIDENCE_TOP_BANNER_URL',
    specificBottomEnv: 'INFRACTION_EVIDENCE_BOTTOM_BANNER_URL',
    systemTopEnv: 'INFRACTION_TOP_BANNER_URL',
    systemBottomEnv: 'INFRACTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.INFRACTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // STAFF PROMOTIONS
  promotion: {
    systemTopEnv: 'PROMOTION_TOP_BANNER_URL',
    systemBottomEnv: 'PROMOTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.PROMOTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  promotion_dm: {
    specificTopEnv: 'PROMOTION_DM_TOP_BANNER_URL',
    specificBottomEnv: 'PROMOTION_DM_BOTTOM_BANNER_URL',
    systemTopEnv: 'PROMOTION_TOP_BANNER_URL',
    systemBottomEnv: 'PROMOTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.PROMOTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  promotion_revoked: {
    specificTopEnv: 'PROMOTION_REVOKED_TOP_BANNER_URL',
    specificBottomEnv: 'PROMOTION_REVOKED_BOTTOM_BANNER_URL',
    systemTopEnv: 'PROMOTION_TOP_BANNER_URL',
    systemBottomEnv: 'PROMOTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.PROMOTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // APPLICATIONS
  application: {
    systemTopEnv: 'APPLICATION_TOP_BANNER_URL',
    systemBottomEnv: 'APPLICATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.APPLICATIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  application_review: {
    specificTopEnv: 'APPLICATION_REVIEW_TOP_BANNER_URL',
    specificBottomEnv: 'APPLICATION_REVIEW_BOTTOM_BANNER_URL',
    systemTopEnv: 'APPLICATION_TOP_BANNER_URL',
    systemBottomEnv: 'APPLICATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.APPLICATIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  application_dm: {
    specificTopEnv: 'APPLICATION_DM_TOP_BANNER_URL',
    specificBottomEnv: 'APPLICATION_DM_BOTTOM_BANNER_URL',
    systemTopEnv: 'APPLICATION_TOP_BANNER_URL',
    systemBottomEnv: 'APPLICATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.APPLICATIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  application_accepted: {
    specificTopEnv: 'APPLICATION_ACCEPTED_TOP_BANNER_URL',
    specificBottomEnv: 'APPLICATION_ACCEPTED_BOTTOM_BANNER_URL',
    systemTopEnv: 'APPLICATION_RESULTS_TOP_BANNER_URL',
    systemBottomEnv: 'APPLICATION_RESULTS_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.APPLICATIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  application_denied: {
    specificTopEnv: 'APPLICATION_DENIED_TOP_BANNER_URL',
    specificBottomEnv: 'APPLICATION_DENIED_BOTTOM_BANNER_URL',
    systemTopEnv: 'APPLICATION_RESULTS_TOP_BANNER_URL',
    systemBottomEnv: 'APPLICATION_RESULTS_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.APPLICATIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  application_results: {
    specificTopEnv: 'APPLICATION_RESULTS_TOP_BANNER_URL',
    specificBottomEnv: 'APPLICATION_RESULTS_BOTTOM_BANNER_URL',
    systemTopEnv: 'APPLICATION_TOP_BANNER_URL',
    systemBottomEnv: 'APPLICATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.APPLICATIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // TRAINING
  training: {
    systemTopEnv: 'TRAINING_TOP_BANNER_URL',
    systemBottomEnv: 'TRAINING_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.TRAINING,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  training_start: {
    specificTopEnv: 'TRAINING_START_TOP_BANNER_URL',
    specificBottomEnv: 'TRAINING_START_BOTTOM_BANNER_URL',
    systemTopEnv: 'TRAINING_TOP_BANNER_URL',
    systemBottomEnv: 'TRAINING_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.TRAINING,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  // CRITICAL EXCEPTION: Training Results uses ONLY bottom banner!
  training_results: {
    noTopBanner: true,
    specificBottomEnv: 'TRAINING_RESULTS_BOTTOM_BANNER_URL',
    systemBottomEnv: 'RESULTS_BOTTOM_BANNER_URL',
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  training_dm: {
    specificTopEnv: 'TRAINING_DM_TOP_BANNER_URL',
    specificBottomEnv: 'TRAINING_DM_BOTTOM_BANNER_URL',
    systemTopEnv: 'TRAINING_TOP_BANNER_URL',
    systemBottomEnv: 'TRAINING_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.TRAINING,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // DEPARTMENTS
  departments: {
    systemTopEnv: 'DEPARTMENTS_TOP_BANNER_URL',
    systemBottomEnv: 'DEPARTMENTS_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DEPARTMENTS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  department_results: {
    specificTopEnv: 'DEPARTMENT_RESULTS_TOP_BANNER_URL',
    specificBottomEnv: 'DEPARTMENT_RESULTS_BOTTOM_BANNER_URL',
    systemTopEnv: 'DEPARTMENTS_TOP_BANNER_URL',
    systemBottomEnv: 'DEPARTMENTS_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DEPARTMENTS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  department_application: {
    specificTopEnv: 'DEPARTMENT_APPLICATION_BANNER_URL',
    systemTopEnv: 'APPLICATION_TOP_BANNER_URL',
    systemBottomEnv: 'APPLICATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.APPLICATIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  department_guidelines: {
    specificTopEnv: 'DEPARTMENT_GUIDELINES_BANNER_URL',
    systemTopEnv: 'DEPARTMENTS_TOP_BANNER_URL',
    systemBottomEnv: 'DEPARTMENTS_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DEPARTMENTS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  chain_of_command: {
    specificTopEnv: 'CHAIN_OF_COMMAND_BANNER_URL',
    systemTopEnv: 'DEPARTMENTS_TOP_BANNER_URL',
    systemBottomEnv: 'DEPARTMENTS_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DEPARTMENTS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // SESSIONS
  session: {
    systemTopEnv: 'SESSION_TOP_BANNER_URL',
    systemBottomEnv: 'SESSION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  session_vote: {
    specificTopEnv: 'SESSION_VOTE_TOP_BANNER_URL',
    specificBottomEnv: 'SESSION_VOTE_BOTTOM_BANNER_URL',
    systemTopEnv: 'SESSION_TOP_BANNER_URL',
    systemBottomEnv: 'SESSION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  session_startup: {
    specificTopEnv: 'SESSION_STARTUP_TOP_BANNER_URL',
    specificBottomEnv: 'SESSION_STARTUP_BOTTOM_BANNER_URL',
    systemTopEnv: 'SESSION_TOP_BANNER_URL',
    systemBottomEnv: 'SESSION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  session_low_population: {
    specificTopEnv: 'SESSION_LOW_POPULATION_TOP_BANNER_URL',
    specificBottomEnv: 'SESSION_LOW_POPULATION_BOTTOM_BANNER_URL',
    systemTopEnv: 'SESSION_TOP_BANNER_URL',
    systemBottomEnv: 'SESSION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  session_full: {
    specificTopEnv: 'SESSION_FULL_TOP_BANNER_URL',
    specificBottomEnv: 'SESSION_FULL_BOTTOM_BANNER_URL',
    systemTopEnv: 'SESSION_TOP_BANNER_URL',
    systemBottomEnv: 'SESSION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  session_shutdown: {
    specificTopEnv: 'SESSION_SHUTDOWN_TOP_BANNER_URL',
    specificBottomEnv: 'SESSION_SHUTDOWN_BOTTOM_BANNER_URL',
    systemTopEnv: 'SESSION_TOP_BANNER_URL',
    systemBottomEnv: 'SESSION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  session_results: {
    specificTopEnv: 'SESSION_RESULTS_TOP_BANNER_URL',
    specificBottomEnv: 'SESSION_RESULTS_BOTTOM_BANNER_URL',
    systemTopEnv: 'SESSION_TOP_BANNER_URL',
    systemBottomEnv: 'SESSION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // TICKETS AND SUPPORT
  ticket: {
    systemTopEnv: 'TICKET_TOP_BANNER_URL',
    systemBottomEnv: 'TICKET_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.ASSISTANCE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  ticket_panel: {
    specificTopEnv: 'TICKET_PANEL_TOP_BANNER_URL',
    specificBottomEnv: 'TICKET_PANEL_BOTTOM_BANNER_URL',
    systemTopEnv: 'TICKET_TOP_BANNER_URL',
    systemBottomEnv: 'TICKET_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.ASSISTANCE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  ticket_transcript: {
    specificTopEnv: 'TICKET_TRANSCRIPT_TOP_BANNER_URL',
    specificBottomEnv: 'TICKET_TRANSCRIPT_BOTTOM_BANNER_URL',
    systemTopEnv: 'TICKET_TOP_BANNER_URL',
    systemBottomEnv: 'TICKET_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.ASSISTANCE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  ticket_closed: {
    specificTopEnv: 'TICKET_CLOSED_TOP_BANNER_URL',
    specificBottomEnv: 'TICKET_CLOSED_BOTTOM_BANNER_URL',
    systemTopEnv: 'TICKET_TOP_BANNER_URL',
    systemBottomEnv: 'TICKET_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.ASSISTANCE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // AI SUPPORT ASSISTANT
  assistant: {
    systemTopEnv: 'ASSISTANT_TOP_BANNER_URL',
    systemBottomEnv: 'ASSISTANT_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.ASSISTANCE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  assistant_welcome: {
    specificTopEnv: 'ASSISTANT_WELCOME_TOP_BANNER_URL',
    specificBottomEnv: 'ASSISTANT_WELCOME_BOTTOM_BANNER_URL',
    systemTopEnv: 'ASSISTANT_TOP_BANNER_URL',
    systemBottomEnv: 'ASSISTANT_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.ASSISTANCE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  assistant_response: {
    specificTopEnv: 'ASSISTANT_RESPONSE_TOP_BANNER_URL',
    specificBottomEnv: 'ASSISTANT_RESPONSE_BOTTOM_BANNER_URL',
    systemTopEnv: 'ASSISTANT_TOP_BANNER_URL',
    systemBottomEnv: 'ASSISTANT_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.ASSISTANCE,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // ER:LC
  erlc: {
    systemTopEnv: 'ERLC_TOP_BANNER_URL',
    systemBottomEnv: 'ERLC_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  erlc_server_info: {
    specificTopEnv: 'ERLC_SERVER_INFO_TOP_BANNER_URL',
    specificBottomEnv: 'ERLC_SERVER_INFO_BOTTOM_BANNER_URL',
    systemTopEnv: 'ERLC_TOP_BANNER_URL',
    systemBottomEnv: 'ERLC_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  erlc_players: {
    specificTopEnv: 'ERLC_PLAYERS_TOP_BANNER_URL',
    specificBottomEnv: 'ERLC_PLAYERS_BOTTOM_BANNER_URL',
    systemTopEnv: 'ERLC_TOP_BANNER_URL',
    systemBottomEnv: 'ERLC_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  erlc_staff: {
    specificTopEnv: 'ERLC_STAFF_TOP_BANNER_URL',
    specificBottomEnv: 'ERLC_STAFF_BOTTOM_BANNER_URL',
    systemTopEnv: 'ERLC_TOP_BANNER_URL',
    systemBottomEnv: 'ERLC_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  erlc_logs: {
    specificTopEnv: 'ERLC_LOGS_TOP_BANNER_URL',
    specificBottomEnv: 'ERLC_LOGS_BOTTOM_BANNER_URL',
    systemTopEnv: 'ERLC_TOP_BANNER_URL',
    systemBottomEnv: 'ERLC_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.SESSIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // COMMUNITY / GENERAL
  community: {
    systemTopEnv: 'COMMUNITY_TOP_BANNER_URL',
    systemBottomEnv: 'COMMUNITY_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.TOP,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  results: {
    systemTopEnv: 'RESULTS_TOP_BANNER_URL',
    systemBottomEnv: 'RESULTS_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.TOP,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  giveaway: {
    specificTopEnv: 'GIVEAWAY_TOP_BANNER_URL',
    specificBottomEnv: 'GIVEAWAY_BOTTOM_BANNER_URL',
    systemTopEnv: 'COMMUNITY_TOP_BANNER_URL',
    systemBottomEnv: 'COMMUNITY_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.TOP,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  commands: {
    specificTopEnv: 'COMMANDS_TOP_BANNER_URL',
    specificBottomEnv: 'COMMANDS_BOTTOM_BANNER_URL',
    systemTopEnv: 'COMMUNITY_TOP_BANNER_URL',
    systemBottomEnv: 'COMMUNITY_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DASHBOARD,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // WELCOME
  welcome: {
    specificTopEnv: 'WELCOME_TOP_BANNER_URL',
    specificBottomEnv: 'WELCOME_BOTTOM_BANNER_URL',
    systemTopEnv: 'COMMUNITY_TOP_BANNER_URL',
    systemBottomEnv: 'COMMUNITY_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.WELCOME,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // SERVER BOOST
  boost: {
    specificTopEnv: 'BOOST_TOP_BANNER_URL',
    specificBottomEnv: 'BOOST_BOTTOM_BANNER_URL',
    systemTopEnv: 'COMMUNITY_TOP_BANNER_URL',
    systemBottomEnv: 'COMMUNITY_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.BOOST,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // SERVER TAG
  server_tag: {
    specificTopEnv: 'TAG_TOP_BANNER_URL',
    specificBottomEnv: 'TAG_BOTTOM_BANNER_URL',
    systemTopEnv: 'COMMUNITY_TOP_BANNER_URL',
    systemBottomEnv: 'COMMUNITY_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.BOOST,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // VERIFICATION
  verification: {
    specificTopEnv: 'VERIFY_TOP_BANNER_URL',
    specificBottomEnv: 'VERIFY_BOTTOM_BANNER_URL',
    systemTopEnv: 'COMMUNITY_TOP_BANNER_URL',
    systemBottomEnv: 'COMMUNITY_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.VERIFICATION,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // FAST PASS
  fastpass: {
    specificTopEnv: 'FASTPASS_TOP_BANNER_URL',
    specificBottomEnv: 'FASTPASS_BOTTOM_BANNER_URL',
    systemTopEnv: 'APPLICATION_TOP_BANNER_URL',
    systemBottomEnv: 'APPLICATION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.FASTPASS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // DEPARTMENT TRANSFERS
  dept_transfer: {
    specificTopEnv: 'DEPT_TRANSFER_TOP_BANNER_URL',
    specificBottomEnv: 'DEPT_TRANSFER_BOTTOM_BANNER_URL',
    systemTopEnv: 'DEPARTMENTS_TOP_BANNER_URL',
    systemBottomEnv: 'DEPARTMENTS_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DEPARTMENTS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // MODERATION (Bans, Kicks, Mutes, Logs, DMs)
  moderation: {
    specificTopEnv: 'MODERATION_TOP_BANNER_URL',
    specificBottomEnv: 'MODERATION_BOTTOM_BANNER_URL',
    systemTopEnv: 'INFRACTION_TOP_BANNER_URL',
    systemBottomEnv: 'INFRACTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.INFRACTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  moderation_dm: {
    specificTopEnv: 'MODERATION_DM_TOP_BANNER_URL',
    specificBottomEnv: 'MODERATION_DM_BOTTOM_BANNER_URL',
    systemTopEnv: 'INFRACTION_DM_TOP_BANNER_URL',
    systemBottomEnv: 'INFRACTION_DM_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.INFRACTIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },
  moderation_log: {
    specificTopEnv: 'MODERATION_LOG_TOP_BANNER_URL',
    specificBottomEnv: 'MODERATION_LOG_BOTTOM_BANNER_URL',
    systemTopEnv: 'INFRACTION_TOP_BANNER_URL',
    systemBottomEnv: 'INFRACTION_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.DASHBOARD,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // SHIFT LOGS (Bottom banner only)
  shift_ended: {
    noTopBanner: true,
    systemBottomEnv: 'SHIFT_LOG_BOTTOM_BANNER_URL',
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // IN-GAME COMMAND LOGS (Bottom banner only)
  ingame_command_log: {
    noTopBanner: true,
    systemBottomEnv: 'COMMAND_LOG_BOTTOM_BANNER_URL',
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // MOD CALL LOGS (NO BANNERS)
  mod_call_log: {
    noTopBanner: true,
    noBottomBanner: true,
    defaultTop: null,
    defaultBottom: null
  },

  // TEAM SWITCH LOGS (NO BANNERS)
  team_switch_log: {
    noTopBanner: true,
    noBottomBanner: true,
    defaultTop: null,
    defaultBottom: null
  },

  // PLAYER JOIN / LEAVE LOGS (NO BANNERS)
  player_join_leave_log: {
    noTopBanner: true,
    noBottomBanner: true,
    defaultTop: null,
    defaultBottom: null
  },

  // KILL LOGS (Bottom banner only)
  kill_log: {
    noTopBanner: true,
    systemBottomEnv: 'KILL_LOG_BOTTOM_BANNER_URL',
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // OFF-DUTY COMMAND LOGS (Bottom banner only)
  offduty_command_log: {
    noTopBanner: true,
    systemBottomEnv: 'OFFDUTY_LOG_BOTTOM_BANNER_URL',
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // LEAVE OF ABSENCE (LOA) LOGS (Bottom banner only)
  loa_request: {
    noTopBanner: true,
    systemBottomEnv: 'LOA_BOTTOM_BANNER_URL',
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // STAFF DEPARTURE / SECURITY LOGS (Bottom banner only)
  staff_departure_log: {
    noTopBanner: true,
    systemBottomEnv: 'SECURITY_BOTTOM_BANNER_URL',
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // TICKET CLOSURE LOG (Bottom banner only)
  ticket_closure_log: {
    noTopBanner: true,
    systemBottomEnv: 'TICKET_CLOSED_BOTTOM_BANNER_URL',
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  },

  // APPLICATION RESULT DM (Top & Bottom banners)
  application_result_dm: {
    systemTopEnv: 'APPLICATION_RESULTS_TOP_BANNER_URL',
    systemBottomEnv: 'APPLICATION_RESULTS_BOTTOM_BANNER_URL',
    defaultTop: DEFAULT_LOCAL_BANNERS.APPLICATIONS,
    defaultBottom: DEFAULT_LOCAL_BANNERS.BOTTOM
  }
};

/**
 * Resolves top and bottom banner URLs with strict 4-level fallback priority:
 * 1. Specific message override / specific message env var
 * 2. Specific system env var
 * 3. Global fallback env var (TOP_BANNER_URL / BOTTOM_BANNER_URL)
 * 4. Local default SVG / null if completely unconfigured
 */
export function resolveBanners(type = 'community', overrideTop = null, overrideBottom = null) {
  const mapping = BANNER_MAPPINGS[type] || BANNER_MAPPINGS.community;

  // Top banner resolution
  let resolvedTop = null;
  if (!mapping.noTopBanner) {
    if (overrideTop && overrideTop.trim().length > 0) {
      resolvedTop = safeUrl(overrideTop);
    } else if (mapping.specificTopEnv && process.env[mapping.specificTopEnv] && process.env[mapping.specificTopEnv].trim().length > 0) {
      resolvedTop = safeUrl(process.env[mapping.specificTopEnv]);
    } else if (mapping.systemTopEnv && process.env[mapping.systemTopEnv] && process.env[mapping.systemTopEnv].trim().length > 0) {
      resolvedTop = safeUrl(process.env[mapping.systemTopEnv]);
    } else if ((process.env.MAIN_BOT_BANNER_URL || process.env.TOP_BANNER_URL) && (process.env.MAIN_BOT_BANNER_URL || process.env.TOP_BANNER_URL).trim().length > 0) {
      resolvedTop = safeUrl(process.env.MAIN_BOT_BANNER_URL || process.env.TOP_BANNER_URL);
    } else {
      resolvedTop = mapping.defaultTop || DEFAULT_LOCAL_BANNERS.TOP;
    }
  }

  // Bottom banner resolution
  let resolvedBottom = null;
  if (!mapping.noBottomBanner) {
    if (overrideBottom && overrideBottom.trim().length > 0) {
      resolvedBottom = safeUrl(overrideBottom);
    } else if (mapping.specificBottomEnv && process.env[mapping.specificBottomEnv] && process.env[mapping.specificBottomEnv].trim().length > 0) {
      resolvedBottom = safeUrl(process.env[mapping.specificBottomEnv]);
    } else if (mapping.systemBottomEnv && process.env[mapping.systemBottomEnv] && process.env[mapping.systemBottomEnv].trim().length > 0) {
      resolvedBottom = safeUrl(process.env[mapping.systemBottomEnv]);
    } else if ((process.env.UNIVERSAL_BOTTOM_BANNER_URL || process.env.BOTTOM_BANNER_URL) && (process.env.UNIVERSAL_BOTTOM_BANNER_URL || process.env.BOTTOM_BANNER_URL).trim().length > 0) {
      resolvedBottom = safeUrl(process.env.UNIVERSAL_BOTTOM_BANNER_URL || process.env.BOTTOM_BANNER_URL);
    } else {
      resolvedBottom = mapping.defaultBottom || DEFAULT_LOCAL_BANNERS.BOTTOM;
    }
  }

  return {
    topBanner: resolvedTop,
    bottomBanner: resolvedBottom
  };
}

/**
 * Centralized Reusable Embed Builder
 * Accepts type, automatically resolves banners, handles Discord image constraints
 * by producing coordinated embeds when top and bottom banners are both present.
 */
export function createWVRPEmbed({
  type = 'community',
  topBanner: customTop = null,
  bottomBanner: customBottom = null,
  title,
  description,
  fields = [],
  color = EMBED_COLOR,
  author,
  footerText = 'West Virginia Roleplay · Premium Discord Roleplay Management',
  footerIcon,
  thumbnail,
  timestamp = true
}) {
  const { topBanner, bottomBanner } = resolveBanners(type, customTop, customBottom);
  const embeds = [];

  // Top banner embed (only if topBanner exists)
  if (topBanner) {
    const topEmbed = new EmbedBuilder()
      .setColor(color)
      .setImage(topBanner);
    embeds.push(topEmbed);
  }

  // Main content embed
  const mainEmbed = new EmbedBuilder().setColor(color);
  if (timestamp) mainEmbed.setTimestamp();
  if (title) mainEmbed.setTitle(title);
  if (description) mainEmbed.setDescription(description);
  if (fields && fields.length > 0) mainEmbed.addFields(fields);
  if (author) mainEmbed.setAuthor(author);
  if (thumbnail) mainEmbed.setThumbnail(thumbnail);
  if (footerText) mainEmbed.setFooter({ text: footerText, iconURL: footerIcon });

  // Bottom banner is attached to mainEmbed image
  if (bottomBanner) {
    mainEmbed.setImage(bottomBanner);
  }

  embeds.push(mainEmbed);
  return embeds;
}

/**
 * Builds a Discord Components V2 Container with top & bottom banner MediaGallery
 * and clean TextDisplay and ActionRow components.
 */
export function createComponentsV2Container({
  type = 'community',
  accentColor = 0x00A8FF,
  title = null,
  subtitle = null,
  description = null,
  fields = [],
  actionRows = [],
  topBanner: customTop = null,
  bottomBanner: customBottom = null
}) {
  const { topBanner, bottomBanner } = resolveBanners(type, customTop, customBottom);
  const container = new ContainerBuilder();

  // Set West Virginia Systems brand accent color (#00A8FF)
  if (accentColor !== null && accentColor !== undefined) {
    container.setAccentColor(typeof accentColor === 'number' ? accentColor : parseInt(String(accentColor).replace('#', '0x'), 16) || 0x00A8FF);
  }

  // 1. Top Banner Media Gallery
  if (topBanner) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(topBanner)
      )
    );
  }

  // 2. Content Display
  const textParts = [];
  if (title) textParts.push(`# ${title}`);
  if (subtitle) textParts.push(`### ${subtitle}`);
  if (description) textParts.push(description);

  if (fields && fields.length > 0) {
    textParts.push('');
    for (const f of fields) {
      textParts.push(`**${f.name}**\n${f.value}`);
    }
  }

  if (textParts.length > 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(textParts.join('\n\n'))
    );
  }

  // 3. Separator
  container.addSeparatorComponents(new SeparatorBuilder());

  // 4. Action Rows (Buttons / Select Menus)
  if (actionRows && actionRows.length > 0) {
    for (const row of actionRows) {
      container.addActionRowComponents(row);
    }
  }

  // 5. Bottom Banner Media Gallery
  if (bottomBanner) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(bottomBanner)
      )
    );
  }

  return container;
}

/**
 * Packages a Components V2 Container into a valid Discord message payload with MessageFlags.IsComponentsV2
 */
export function createV2MessagePayload(container, extraActionRows = []) {
  return {
    components: [container, ...extraActionRows],
    flags: MessageFlags.IsComponentsV2
  };
}

/**
 * Components V2: Moderation Action Completed Confirmation Interface
 */
export function createModerationConfirmationV2({
  caseId,
  action,
  target,
  moderator,
  reason,
  date = new Date(),
  duration = null,
  status = 'SUCCESSFUL',
  dmStatus = 'DELIVERED',
  actionRows = []
}) {
  const tsSeconds = Math.floor((date instanceof Date ? date.getTime() : (typeof date === 'number' ? date : Date.now())) / 1000);
  const targetMention = target.id ? `<@${target.id}>` : (target.username || 'Member');
  const targetTag = target.tag || target.username || target.id || 'User';
  const modMention = moderator.id ? `<@${moderator.id}>` : (moderator.username || 'Staff');
  const modTag = moderator.tag || moderator.username || moderator.id || 'Staff';

  const details = [
    `**Case ID:** \`${caseId}\``,
    `**Action:** \`${action.toUpperCase()}\``,
    `**Target:** ${targetMention} (\`${targetTag}\` · \`${target.id || 'N/A'}\`)`,
    `**Moderator:** ${modMention} (\`${modTag}\`)`,
    duration ? `**Duration:** \`${duration}\`` : null,
    `**Reason:** ${reason}`,
    `**Date:** <t:${tsSeconds}:F> (<t:${tsSeconds}:R>)`,
    `**Status:** \`${status}\``,
    `**DM Notification:** \`${dmStatus}\``
  ].filter(Boolean).join('\n');

  const defaultRow = actionRows.length === 0 ? [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mod_case_${caseId}`)
        .setLabel('Inspect Case')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔍'),
      new ButtonBuilder()
        .setCustomId(`mod_history_${target.id || ''}`)
        .setLabel('User History')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📜'),
      new ButtonBuilder()
        .setCustomId('mod_stats_open')
        .setLabel('Mod Stats')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊')
    )
  ] : actionRows;

  const container = createComponentsV2Container({
    type: 'moderation',
    accentColor: 0x00A8FF,
    title: '🛡️ MODERATION ACTION COMPLETED',
    subtitle: 'West Virginia State Roleplay · Enforcement Directive',
    description: details,
    actionRows: defaultRow
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Automatic Moderation Direct Message (DM)
 */
export function createModerationDmV2({
  action, // 'BAN' | 'KICK' | 'MUTE' | 'UNMUTE'
  caseId,
  communityName = 'West Virginia State Roleplay',
  moderator,
  reason,
  date = new Date(),
  duration = null,
  expiration = null,
  relatedCaseId = null,
  appealUrl = null
}) {
  const tsSeconds = Math.floor((date instanceof Date ? date.getTime() : (typeof date === 'number' ? date : Date.now())) / 1000);
  const modMention = moderator?.id ? `<@${moderator.id}>` : (moderator?.username || 'West Virginia Systems Staff');
  const container = new ContainerBuilder().setAccentColor(0x00A8FF);
  const { topBanner, bottomBanner } = resolveBanners('moderation_dm');

  if (topBanner) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(topBanner))
    );
  }

  let title = '🛡️ MODERATION NOTICE';
  let bodyLines = [];
  const actionRow = new ActionRowBuilder();

  if (action === 'BAN') {
    title = '🚨 You Have Been Banned';
    bodyLines = [
      `You have been officially banned from **${communityName}**.`,
      '',
      `• **Community:** ${communityName}`,
      `• **Case ID:** \`${caseId}\``,
      `• **Moderation Action:** \`BAN\``,
      `• **Reason:** "${reason}"`,
      `• **Moderator:** ${modMention}`,
      `• **Date & Time:** <t:${tsSeconds}:F>`,
      '',
      '📌 **Appeal Instructions:**',
      appealUrl
        ? `If you believe this ban was placed in error, you may submit a formal appeal at: ${appealUrl}`
        : 'If you believe this ban was placed in error, join our official Ban Appeals server or contact High Command through authorized channels.'
    ];
    if (appealUrl) {
      actionRow.addComponents(
        new ButtonBuilder().setLabel('Submit Ban Appeal').setStyle(ButtonStyle.Link).setURL(appealUrl).setEmoji('⚖️')
      );
    }
  } else if (action === 'KICK') {
    title = '⚠️ You Have Been Kicked';
    bodyLines = [
      `You have been kicked from **${communityName}**.`,
      '',
      `• **Community:** ${communityName}`,
      `• **Case ID:** \`${caseId}\``,
      `• **Moderation Action:** \`KICK\``,
      `• **Reason:** "${reason}"`,
      `• **Moderator:** ${modMention}`,
      `• **Date & Time:** <t:${tsSeconds}:F>`,
      '',
      'You are permitted to rejoin the server provided you adhere strictly to all community regulations.'
    ];
  } else if (action === 'MUTE') {
    title = '🔇 You Have Been Muted';
    const expSeconds = expiration ? Math.floor((expiration instanceof Date ? expiration.getTime() : expiration) / 1000) : null;
    bodyLines = [
      `You have been placed on timeout (muted) in **${communityName}**.`,
      '',
      `• **Community:** ${communityName}`,
      `• **Case ID:** \`${caseId}\``,
      `• **Duration:** \`${duration || 'Temporary'}\``,
      expSeconds ? `• **Expiration Time:** <t:${expSeconds}:F> (<t:${expSeconds}:R>)` : null,
      `• **Reason:** "${reason}"`,
      `• **Moderator:** ${modMention}`,
      `• **Date & Time:** <t:${tsSeconds}:F>`,
      '',
      'During this timeout, you cannot send messages, add reactions, or join voice channels. Please review community rules while waiting for expiration.'
    ].filter(Boolean);
  } else if (action === 'UNMUTE') {
    title = '🔊 Your Mute Has Been Removed';
    bodyLines = [
      `Your timeout has been removed in **${communityName}**.`,
      '',
      `• **Community:** ${communityName}`,
      relatedCaseId ? `• **Original Mute Case:** \`${relatedCaseId}\`` : null,
      `• **Unmute Case ID:** \`${caseId}\``,
      `• **Moderator:** ${modMention}`,
      `• **Reason:** "${reason}"`,
      `• **Date & Time:** <t:${tsSeconds}:F>`,
      '',
      'Your text and voice channel privileges have been restored. Welcome back to West Virginia State Roleplay!'
    ].filter(Boolean);
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${title}\n### ${communityName} · Disciplinary Department\n\n${bodyLines.join('\n')}`)
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  if (actionRow.components.length > 0) {
    container.addActionRowComponents(actionRow);
  }

  if (bottomBanner) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bottomBanner))
    );
  }

  return createV2MessagePayload(container);
}

/**
 * Components V2: Moderation Log Channel Broadcast
 */
export function createModerationLogV2({
  caseId,
  action,
  target,
  moderator,
  reason,
  timestamp = Date.now(),
  duration = null,
  dmStatus = 'DELIVERED',
  executionStatus = 'SUCCESSFUL'
}) {
  const tsSeconds = Math.floor(timestamp / 1000);
  const logLines = [
    `# 📜 MODERATION LOG ENTRY · ${caseId}`,
    `### West Virginia State Roleplay · Audit Registry`,
    '',
    `• **Case ID:** \`${caseId}\``,
    `• **Action:** \`${action.toUpperCase()}\``,
    `• **Target Username:** \`${target.username || 'Unknown'}\``,
    `• **Target Discord ID:** \`${target.id}\` (<@${target.id}>)`,
    `• **Moderator Username:** \`${moderator.username || 'Staff'}\``,
    `• **Moderator Discord ID:** \`${moderator.id}\` (<@${moderator.id}>)`,
    duration ? `• **Duration:** \`${duration}\`` : null,
    `• **Reason:** "${reason}"`,
    `• **Timestamp:** <t:${tsSeconds}:F> (<t:${tsSeconds}:R>)`,
    `• **DM Delivery:** \`${dmStatus}\``,
    `• **Execution Status:** \`${executionStatus}\``
  ].filter(Boolean).join('\n');

  const container = createComponentsV2Container({
    type: 'moderation_log',
    accentColor: 0x00A8FF,
    description: logLines,
    actionRows: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`mod_case_${caseId}`).setLabel('Case Record').setStyle(ButtonStyle.Secondary).setEmoji('🔍'),
        new ButtonBuilder().setCustomId(`mod_history_${target.id}`).setLabel('Target History').setStyle(ButtonStyle.Secondary).setEmoji('📜')
      )
    ]
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Moderation Statistics Panel
 */
export function createModerationStatsV2({
  stats,
  filter = 'ALL',
  targetUser = null
}) {
  const filterLabel = filter === 'ALL'
    ? 'All Moderation Actions'
    : filter === 'MODERATOR' && targetUser
    ? `Filtered by Moderator: @${targetUser.username || targetUser.id}`
    : filter === 'MEMBER' && targetUser
    ? `Filtered by Member: @${targetUser.username || targetUser.id}`
    : `Filtered by ${filter}s`;

  const statText = [
    `# 📊 WVRP MODERATION STATISTICS`,
    `### West Virginia Systems · Staff Operations Hub`,
    `*${filterLabel}*`,
    '',
    `• **Total Cases:** \`${stats.totalCases.toLocaleString()}\``,
    `• **Bans:** \`${stats.bans.toLocaleString()}\``,
    `• **Kicks:** \`${stats.kicks.toLocaleString()}\``,
    `• **Mutes:** \`${stats.mutes.toLocaleString()}\``,
    `• **Unmutes:** \`${stats.unmutes.toLocaleString()}\``,
    `• **Active Mutes:** \`${stats.activeMutes.toLocaleString()}\``,
    `• **Active Moderators:** \`${stats.activeModerators.toLocaleString()}\``
  ].join('\n');

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mod_stats_filter_ALL').setLabel('All Actions').setStyle(filter === 'ALL' ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('🌐'),
    new ButtonBuilder().setCustomId('mod_stats_filter_BAN').setLabel('Bans').setStyle(filter === 'BAN' ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('🚨'),
    new ButtonBuilder().setCustomId('mod_stats_filter_KICK').setLabel('Kicks').setStyle(filter === 'KICK' ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('⚠️'),
    new ButtonBuilder().setCustomId('mod_stats_filter_MUTE').setLabel('Mutes').setStyle(filter === 'MUTE' ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('🔇')
  );

  const container = createComponentsV2Container({
    type: 'staff_dashboard',
    accentColor: 0x00A8FF,
    description: statText,
    actionRows: [row1]
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Moderation History Interface
 */
export function createModerationHistoryV2({
  target,
  cases = [],
  page = 1,
  totalPages = 1,
  totalCases = 0
}) {
  const targetMention = `<@${target.id}>`;
  const targetTag = target.tag || target.username || target.id;

  let casesList = '';
  if (cases.length === 0) {
    casesList = '*No moderation cases recorded for this member.*';
  } else {
    casesList = cases.map(c => {
      const tsSeconds = Math.floor(c.timestamp / 1000);
      const dur = c.duration ? ` · Duration: \`${c.duration}\`` : '';
      const st = c.status === 'ACTIVE' ? '🟢 Active' : c.status === 'REVOKED' ? '⚪ Revoked' : '🔴 Closed';
      return `### \`${c.id}\` · ${c.action_type}${dur}\n> **Moderator:** <@${c.moderator_id}> (\`${c.moderator_username}\`)\n> **Reason:** ${c.reason}\n> **Date:** <t:${tsSeconds}:d> (<t:${tsSeconds}:R>) · **Status:** ${st}`;
    }).join('\n\n');
  }

  const desc = [
    `# 📜 Moderation History — ${targetTag}`,
    `### Member: ${targetMention} (\`${target.id}\`)`,
    `Total Cases on Record: **${totalCases}** · Page **${page}** of **${totalPages}**`,
    '',
    casesList
  ].join('\n');

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`mod_history_${target.id}_${page - 1}`)
      .setLabel('Previous Page')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1)
      .setEmoji('⬅️'),
    new ButtonBuilder()
      .setCustomId(`mod_history_${target.id}_${page + 1}`)
      .setLabel('Next Page')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
      .setEmoji('➡️'),
    new ButtonBuilder()
      .setCustomId('mod_stats_open')
      .setLabel('Global Stats')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📊')
  );

  const container = createComponentsV2Container({
    type: 'moderation',
    accentColor: 0x00A8FF,
    description: desc,
    actionRows: [navRow]
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Individual Case Information Interface
 */
export function createModerationCaseInfoV2({ caseData }) {
  const tsSeconds = Math.floor(caseData.timestamp / 1000);
  const expSeconds = caseData.expiration_timestamp ? Math.floor(caseData.expiration_timestamp / 1000) : null;

  const desc = [
    `# 🔍 Moderation Case File · ${caseData.id}`,
    `### West Virginia State Roleplay · Internal Affairs Registry`,
    '',
    `• **Case ID:** \`${caseData.id}\` (#${caseData.case_number})`,
    `• **Action:** \`${caseData.action_type}\``,
    `• **Target Member:** <@${caseData.target_id}> (\`${caseData.target_username}\` · \`${caseData.target_id}\`)`,
    `• **Issuing Moderator:** <@${caseData.moderator_id}> (\`${caseData.moderator_username}\` · \`${caseData.moderator_id}\`)`,
    caseData.duration ? `• **Duration:** \`${caseData.duration}\`` : null,
    expSeconds ? `• **Expiration:** <t:${expSeconds}:F> (<t:${expSeconds}:R>)` : null,
    caseData.related_case_id ? `• **Related Case ID:** \`${caseData.related_case_id}\`` : null,
    `• **Reason:** "${caseData.reason}"`,
    `• **Recorded Date:** <t:${tsSeconds}:F>`,
    `• **Current Status:** \`${caseData.status}\``,
    `• **DM Delivery:** \`${caseData.dm_status}\``
  ].filter(Boolean).join('\n');

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`mod_history_${caseData.target_id}`)
      .setLabel('Target History')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📜'),
    new ButtonBuilder()
      .setCustomId('mod_stats_open')
      .setLabel('Moderation Stats')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📊')
  );

  if (caseData.action_type === 'MUTE' && caseData.status === 'ACTIVE') {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`mod_unmute_${caseData.target_id}`)
        .setLabel('Unmute Member')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔊')
    );
  }

  const container = createComponentsV2Container({
    type: 'moderation',
    accentColor: 0x00A8FF,
    description: desc,
    actionRows: [actionRow]
  });

  return createV2MessagePayload(container);
}

export class WvrpEmbedBuilder {
  static createWVRPEmbed(options) {
    return createWVRPEmbed(options);
  }

  static createComponentsV2Container(options) {
    return createComponentsV2Container(options);
  }

  static createV2MessagePayload(container, extraRows = []) {
    return createV2MessagePayload(container, extraRows);
  }

  static createModerationConfirmationV2(options) {
    return createModerationConfirmationV2(options);
  }

  static createModerationDmV2(options) {
    return createModerationDmV2(options);
  }

  static createModerationLogV2(options) {
    return createModerationLogV2(options);
  }

  static createModerationStatsV2(options) {
    return createModerationStatsV2(options);
  }

  static createModerationHistoryV2(options) {
    return createModerationHistoryV2(options);
  }

  static createModerationCaseInfoV2(options) {
    return createModerationCaseInfoV2(options);
  }

  static createBase(options = {}) {
    const embed = new EmbedBuilder()
      .setColor(options.color || EMBED_COLOR)
      .setTimestamp(options.timestamp !== false ? new Date() : null);

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);

    if (options.author) {
      embed.setAuthor({
        name: options.author.name || 'West Virginia Roleplay',
        iconURL: options.author.iconURL || options.thumbnail,
        url: options.author.url
      });
    }

    embed.setFooter({
      text: options.footerText || 'West Virginia Roleplay · discord.gg/wvrp',
      iconURL: options.footerIcon
    });

    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    return embed;
  }

  static createDualBannerEmbeds(options) {
    return createWVRPEmbed(options);
  }

  static createSuccessEmbed({ title = 'Operation Successful', description, footerText = 'West Virginia Systems · Success', fields = [] }) {
    const embed = WvrpEmbedBuilder.createBase({
      color: 0x23a55a,
      title: `✅ ${title.replace(/^[✅\s]+/, '')}`,
      description,
      footerText
    });
    if (fields && fields.length > 0) embed.addFields(fields);
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
    return embed;
  }

  static createErrorEmbed({ title = 'Error Encountered', description, footerText = 'West Virginia Systems · Error', fields = [] }) {
    const embed = WvrpEmbedBuilder.createBase({
      color: 0xf23f43,
      title: `❌ ${title.replace(/^[❌\s]+/, '')}`,
      description,
      footerText
    });
    if (fields && fields.length > 0) embed.addFields(fields);
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
    return embed;
  }

  static createWarningEmbed({ title = 'Attention Required', description, footerText = 'West Virginia Systems · Warning', fields = [] }) {
    const embed = WvrpEmbedBuilder.createBase({
      color: 0xfee75c,
      title: `⚠️ ${title.replace(/^[⚠️\s]+/, '')}`,
      description,
      footerText
    });
    if (fields && fields.length > 0) embed.addFields(fields);
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
    return embed;
  }

  static createInfoEmbed({ title, description, footerText = 'West Virginia Systems · Information', fields = [] }) {
    const embed = WvrpEmbedBuilder.createBase({
      color: 0x00a8ff,
      title: `ℹ️ ${title ? title.replace(/^[ℹ️\s]+/, '') : 'Information'}`,
      description,
      footerText
    });
    if (fields && fields.length > 0) embed.addFields(fields);
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
    return embed;
  }

  static createDepartmentEmbed({ department, leader, roster = [] }) {
    return createWVRPEmbed({
      type: 'departments',
      title: `⭐ ${department.name}`,
      description: `${department.description}\n\n👑 **Department Leadership:** ${leader ? `<@${leader.id || leader}> (\`${department.leader_tag || 'Commander'}\`)` : 'Management Directive'}\n👥 **Active Personnel:** \`${roster.length} Officers/Members\`\n\n${roster.length > 0 ? roster.slice(0, 10).map(m => `• **${m.rank || 'Member'}** <@${m.user_id}> (\`${m.callsign || 'N/A'}\`)`).join('\n') : '*No personnel officially assigned to roster yet.*'}`,
      footerText: 'West Virginia State Roleplay · Department Operations'
    });
  }

  static createChainOfCommandEmbed({ departmentName = 'West Virginia State Roleplay', hierarchy = [] }) {
    let desc = `### ${departmentName} · Chain of Command\nOfficial organizational hierarchy and leadership structure.\n\n`;
    if (hierarchy.length === 0) {
      desc += '*No chain of command records found for this division.*';
    } else {
      hierarchy.forEach(item => {
        const star = item.is_leadership ? '⭐' : '🔹';
        desc += `${star} **${item.rank_name}** — <@${item.user_id}> (\`${item.user_tag || 'Staff'}\`)\n> ↳ *Position:* **${item.position_title}**\n\n`;
      });
    }
    return createWVRPEmbed({
      type: 'chain_of_command',
      title: `🏛️ ${departmentName} — Chain of Command`,
      description: desc.trim(),
      footerText: 'West Virginia State Roleplay · Chain of Command'
    });
  }

  // Exact Infraction Layout: INF-0000
  static createInfractionEmbed({ staffMention, punishment, reason, issuerMention, infractionId, appealable = true, isDm = false }) {
    return createWVRPEmbed({
      type: isDm ? 'infraction_dm' : 'infraction',
      title: 'Infraction Notice',
      description: `🪪 **Staff Member:** ${staffMention}\n🛡️ **Punishment:** ${punishment}\n📎 **Appealable:** ${appealable ? 'Yes' : 'No'}\n\n📌 **Reason:** ${reason}\n\n👤 ${issuerMention} — **${infractionId}**`,
      footerText: `WVRP Disciplinary Record · ${infractionId}`
    });
  }

  // Exact Promotion Layout: PRO-0000
  static createPromotionEmbed({ staffMention, newRank, reason, issuerMention, promotionId, isDm = false }) {
    return createWVRPEmbed({
      type: isDm ? 'promotion_dm' : 'promotion',
      title: 'Staff Promotion',
      description: `🪪 **Staff Member:** ${staffMention}\n🎖️ **Promotion:** ${newRank}\n\n📌 **Reason:** ${reason}\n\n👤 ${issuerMention} — **${promotionId}**`,
      footerText: `WVRP Promotion Registry · ${promotionId}`
    });
  }

  // Exact Staff Feedback Layout
  static createFeedbackEmbed({ staffMention, ratedByMention, rating, comment }) {
    return createWVRPEmbed({
      type: 'staff_feedback',
      title: 'Staff Feedback',
      description: `🪪 **Staff Member:** ${staffMention}\n👤 **Rated By:** ${ratedByMention}\n⭐ **Rating:** ${rating}/5\n📌 **Comment:** ${comment}`,
      footerText: 'WVRP Staff Quality & Feedback Assessment'
    });
  }

  // Exact Training Log Layout (Bottom banner only — uses training_results)
  static createTrainingLogEmbed({ traineeMention, traineeUsername, trainerMention, trainerUsername, result = 'Passed', notes = 'Did overall good.' }) {
    return createWVRPEmbed({
      type: 'training_results',
      color: result === 'Passed' ? 0x22c55e : 0xef4444,
      title: '📁 Training Log',
      description: `👤 **Trainee:** ${traineeMention} (${traineeUsername})\n🛡️ **Trainer:** ${trainerMention} (${trainerUsername})\n✅ **Result:** ${result}\n📅 **Date:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n📌 **Notes**\n> ${notes}`,
      footerText: 'WVRP Staff Academy Record'
    });
  }

  // Exact Training Announcement Layout (Top & Bottom Banners)
  static createTrainingAnnouncementEmbed({ trainerMention, status = 'Ended', startedAgo = '3 hours ago (7:10 PM)', endedDuration = 'after 8 minutes', attendingList = 'Nobody yet' }) {
    return createWVRPEmbed({
      type: 'training_start',
      title: 'Staff Training',
      description: `This training session has ended. Thank you to everyone who attended.\n\n> You must complete a training within **7 days** of becoming a Trainee, otherwise it will result in an immediate termination.\n\n**How to attend**\n1. Press **Join Game** below to load into the server\n2. Go to the **Police Team briefing room** and wait for your trainer\n3. Make sure you are wearing the **staff uniform**\n\n🛡️ **Trainer:** ${trainerMention}\n⏰ **Started:** ${startedAgo}\n📌 **Status:** ${status}\n📅 **Ended:** ${status === 'Ended' ? `${startedAgo} ${endedDuration}` : 'Ongoing'}\n👥 **Attending (0):** ${attendingList}`,
      footerText: 'West Virginia Roleplay Staff Academy'
    });
  }

  // Exact Ticket Closed DM Layout
  static createTicketClosedDm({ ticketId, category, handledByMention, closedByMention, openedDate, duration, messageCount }) {
    return createWVRPEmbed({
      type: 'ticket_closed',
      title: `Ticket #${ticketId} — ${category}`,
      description: `Your ${category} ticket has been closed.\n\n↳ **Handled By:** ${handledByMention}\n↳ **Closed By:** ${closedByMention}\n⏰ **Opened:** ${openedDate}\n⏰ **Closed:** Just now\n⏳ **Duration:** ${duration}\n🎫 **Messages Sent:** ${messageCount} messages\n\nClick **Online Transcript** below to view the archived conversation.`,
      footerText: 'West Virginia Support Center Transcript System'
    });
  }

  // Exact Welcome Layout: Reference Replacement for WVRP
  static createWelcomeEmbed({ memberMention, username, avatarUrl, memberCount = 20028, accountCreated, joinedAt }) {
    const ordinal = getOrdinalSuffix(memberCount);
    return createWVRPEmbed({
      type: 'welcome',
      title: '👋 Welcome to West Virginia State Roleplay!',
      description: `• Welcome **${memberMention}** to **West Virginia State Roleplay!**\n• You are our **${ordinal}** member.\n• We hope you enjoy your stay!\n• Ensure you verify to access the appropriate community features and participate in ER:LC.`,
      thumbnail: avatarUrl || undefined,
      fields: [
        { name: '👤 Username', value: `\`${username}\``, inline: true },
        { name: '👥 Member Count', value: `\`${memberCount.toLocaleString()} members\``, inline: true },
        ...(accountCreated ? [{ name: '🗓️ Account Created', value: `\`${accountCreated}\``, inline: true }] : []),
        ...(joinedAt ? [{ name: '🚪 Joined Server', value: `\`${joinedAt}\``, inline: true }] : [])
      ],
      footerText: 'West Virginia State Roleplay · Welcome Center'
    });
  }

  // Exact Server Boost Embed
  static createBoostEmbed({ memberMention, username, avatarUrl, boostLevel = 3, boostCount = 14 }) {
    return createWVRPEmbed({
      type: 'boost',
      title: 'Thank You for Repping Us!',
      description: `> Thank you **${memberMention}** for boosting our **WVRP** server! Showing your support helps our community grow and makes West Virginia State Roleplay even better.`,
      thumbnail: avatarUrl || undefined,
      fields: [
        { name: '💎 Boosting Member', value: `${memberMention} (\`${username}\`)`, inline: true },
        { name: '🚀 Server Boost Level', value: `**Level ${boostLevel}**`, inline: true },
        { name: '✨ Total Boosts', value: `\`${boostCount} Boosts\``, inline: true }
      ],
      footerText: 'West Virginia State Roleplay · Server Boost Perks'
    });
  }

  // Exact Server Tag Notification Embed
  static createServerTagEmbed({ memberMention, username, avatarUrl, tag = 'WVRP' }) {
    return createWVRPEmbed({
      type: 'server_tag',
      title: 'Thank You for Repping Us!',
      description: `> Thank you **${memberMention}** for equipping our **${tag}** server tag! Showing it off helps more people discover **West Virginia State Roleplay**.`,
      thumbnail: avatarUrl || undefined,
      fields: [
        { name: '🏷️ Equipped Tag', value: `\`${tag}\``, inline: true },
        { name: '👤 Supporter', value: `${memberMention}`, inline: true }
      ],
      footerText: 'West Virginia State Roleplay · Community Representatives'
    });
  }

  // Exact Roblox & Bloxlink Verification Embed
  static createVerificationEmbed({ userMention, username, userId, robloxUser, bloxlinkStatus = 'VERIFIED', verified = true, isStaffReview = false }) {
    const statusEmoji = verified ? '✅' : '⚠️';
    const statusText = verified ? 'Verified Member' : 'Pending Verification';

    const fields = [
      { name: '💬 Discord Account', value: `${userMention}\n\`${userId}\``, inline: true },
      { name: '🎮 Roblox Username', value: robloxUser?.username ? `[${robloxUser.username}](${robloxUser.profileUrl || `https://www.roblox.com/users/${robloxUser.id}/profile`})` : '`Not Linked`', inline: true },
      { name: '🪪 Roblox User ID', value: `\`${robloxUser?.id || 'N/A'}\``, inline: true },
      { name: '🏷️ Display Name', value: `\`${robloxUser?.displayName || robloxUser?.username || 'N/A'}\``, inline: true },
      { name: '🔗 Bloxlink Status', value: `\`${bloxlinkStatus}\``, inline: true },
      { name: `${statusEmoji} Verification State`, value: `**${statusText}**`, inline: true }
    ];

    if (robloxUser?.groupRank) {
      fields.push({ name: '🏛️ WVRP Group Rank', value: `\`${robloxUser.groupRank}\``, inline: true });
    }

    if (robloxUser?.createdAt) {
      fields.push({ name: '🗓️ Roblox Created', value: `\`${robloxUser.createdAt}\``, inline: true });
    }

    return createWVRPEmbed({
      type: 'verification',
      title: `${statusEmoji} Roblox & Bloxlink Verification`,
      description: verified
        ? `Account verification confirmed for **${userMention}**! Your Discord identity is linked with your official Roblox account.`
        : `Verification check in progress for **${userMention}**. Please link your account or click **Check Verification** once completed on Bloxlink.`,
      fields,
      thumbnail: robloxUser?.avatarHeadshot || robloxUser?.thumbnail || undefined,
      footerText: isStaffReview ? 'WVRP Verification Registry · Staff Review Protocol' : 'West Virginia State Roleplay · Verification Service'
    });
  }

  // Fast-Pass Embed Layout
  static createFastPassEmbed({ userMention, fastPassEmoji = '⚡' }) {
    const greeting = userMention ? `Hello ${userMention},\n\n` : '';
    return createWVRPEmbed({
      type: 'fastpass',
      title: `${fastPassEmoji} Fast-Pass Staff Application`,
      description: `${greeting}**Fast-Pass**\n\n**Your ROBLOX User:**\n\n**All your previous experiences, please include member count and your rank.**\n\n**Server invite CODE, if possible:**\n\n**Why do I want to be staff here?**\n\n*Copy this, fill in every line and send it here. The team will review it.*`,
      footerText: 'West Virginia State Roleplay · Fast-Pass Staff Recruitment'
    });
  }

  // Department Transfer Layout
  static createDeptTransferEmbed({ userMention }) {
    const greeting = userMention ? `Hello ${userMention},\n\n` : '';
    return createWVRPEmbed({
      type: 'dept_transfer',
      title: '🚓 Department Transfer Application',
      description: `${greeting}**Department Transfer Request**\n\n**Roblox Username:**\n\n**Current Department:**\n\n**Current Rank:**\n\n**Requested Department:**\n\n**Previous Experience:**\n\n**Reason for Requesting a Transfer:**\n\n*Copy this, fill in every line and send it here. Department High Command will evaluate your qualifications.*`,
      footerText: 'West Virginia State Roleplay · Department Oversight'
    });
  }
}

// ==========================================
// DISCORD COMPONENTS V2 BUILDERS (SUITE)
// ==========================================

/**
 * Components V2: Shift Ended Log
 */
export function createShiftEndedLogV2({
  staffUser,
  staffMember,
  robloxUsername = 'Not Linked',
  shiftType = 'NORMAL',
  startedAt,
  endedAt,
  timeOnShift = '0m',
  timeOnBreak = '0m'
}) {
  const staffMention = staffUser ? `<@${staffUser.id}>` : (staffMember ? `<@${staffMember.id}>` : '@StaffMember');
  const staffTag = staffUser?.tag || staffUser?.username || staffMember?.user?.tag || staffMember?.user?.username || 'StaffMember';
  const startSec = Math.floor((startedAt || Date.now()) / 1000);
  const endSec = Math.floor((endedAt || Date.now()) / 1000);
  const displayShiftType = shiftType === '50/50' || shiftType === '5050' ? '50/50 Shift' : (shiftType.toLowerCase().includes('shift') ? shiftType : `${shiftType} Shift`);

  const desc = [
    `# 🟢 [Shift Ended]`,
    `**Staff Member:** ${staffMention} (\`${staffTag}\`)`,
    `**Roblox:** \`${robloxUsername}\``,
    `**Shift Type:** \`${displayShiftType}\``,
    `**Shift Started:** <t:${startSec}:F>`,
    `**Shift Ended:** <t:${endSec}:F>`,
    `**Time On Shift:** \`${timeOnShift}\``,
    `**Time On Break:** \`${timeOnBreak}\``
  ].join('\n\n');

  const container = createComponentsV2Container({
    type: 'shift_ended',
    accentColor: 0x00A8FF,
    description: desc
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: In-Game Commands Given Log
 */
export function createInGameCommandLogV2({
  staff = 'Remote Server',
  permissions = 'Unknown',
  when = null,
  command = ':cmds',
  robloxUsername = null,
  robloxId = null
}) {
  const ts = when ? Math.floor(new Date(when).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const staffDisplay = robloxId && robloxUsername
    ? `[${robloxUsername}](https://www.roblox.com/users/${robloxId}/profile) (\`${robloxId}\`)`
    : (robloxUsername ? `\`${robloxUsername}\`` : `\`${staff}\``);

  const desc = [
    `# 🛡️ In-Game Commands Given`,
    `**Staff:** ${staffDisplay}`,
    `**Permissions:** \`${permissions || 'Unknown'}\``,
    `**When:** <t:${ts}:F> (<t:${ts}:R>)`,
    '',
    `**Command:**`,
    `\`\`\`\n${command}\n\`\`\``
  ].join('\n');

  const container = createComponentsV2Container({
    type: 'ingame_command_log',
    accentColor: 0x00A8FF,
    description: desc
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Mod Call Log (No banners)
 */
export function createModCallLogV2({
  caller = 'Unknown',
  status = 'Unanswered',
  answeredBy = null,
  responseTime = null,
  timestamp = null
}) {
  const ts = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const isAnswered = status.toLowerCase().includes('answered') && !status.toLowerCase().includes('unanswered');

  const lines = [
    `# 📞 Mod Call`,
    `**Caller:** \`${caller}\``
  ];

  if (isAnswered) {
    lines.push(`**Status:** Answered by \`${answeredBy || 'Staff'}\``);
    if (responseTime) lines.push(`**Response Time:** \`${responseTime}\``);
    lines.push(`**Time:** <t:${ts}:T> · <t:${ts}:F>`);
  } else {
    lines.push(`**Status:** \`Unanswered\``);
    lines.push(`**Time:** <t:${ts}:T>`);
    lines.push(`<t:${ts}:F>`);
  }

  const container = createComponentsV2Container({
    type: 'mod_call_log',
    accentColor: 0x00A8FF,
    description: lines.join('\n\n')
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Team Switch Log (No banners)
 */
export function createTeamSwitchLogV2({
  player = 'Unknown',
  previousTeam = 'Civilian',
  newTeam = 'Police',
  timestamp = null
}) {
  const ts = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);

  const desc = [
    `# 🔄 Team Switch`,
    `\`${player}\` · **${previousTeam}** → **${newTeam}** · <t:${ts}:T>`
  ].join('\n\n');

  const container = createComponentsV2Container({
    type: 'team_switch_log',
    accentColor: 0x00A8FF,
    description: desc
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Player Join and Leave Log (No banners)
 */
export function createPlayerJoinLeaveLogV2({
  action = 'JOIN', // 'JOIN' | 'LEAVE'
  player = 'Unknown',
  robloxId = null,
  playtime = '0m',
  timestamp = null,
  onlineCount = 0,
  maxCapacity = 50
}) {
  const isJoin = action.toUpperCase() === 'JOIN';
  const ts = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const profileLink = robloxId
    ? `[${player}](https://www.roblox.com/users/${robloxId}/profile)`
    : `\`${player}\``;

  const title = isJoin ? '🟢 Player Joined' : '🔴 Player Left';
  const eventDesc = isJoin ? `\`${player}\` joined the server.` : `\`${player}\` left the server.`;

  const desc = [
    `# ${title}`,
    `**Roblox profile link:** ${profileLink}`,
    eventDesc,
    `**Playtime:** \`${playtime}\``,
    `<t:${ts}:F>`,
    `**Players Online:** \`${onlineCount}/${maxCapacity}\``
  ].join('\n\n');

  const container = createComponentsV2Container({
    type: 'player_join_leave_log',
    accentColor: isJoin ? 0x23A55A : 0xDA373C,
    description: desc
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Kill Log and RDM Tracking (Bottom banner)
 */
export function createKillLogV2({
  victim = 'Victim',
  victimId = null,
  killer = 'Killer',
  killerId = null,
  timestamp = null,
  isSuspectedRdm = false,
  rdmReason = null,
  killerStats = { kills: 1, deaths: 0, rdmWarnings: 0 }
}) {
  const ts = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const victimLink = victimId ? `[${victim}](https://www.roblox.com/users/${victimId}/profile)` : `\`${victim}\``;
  const killerLink = killerId ? `[${killer}](https://www.roblox.com/users/${killerId}/profile)` : `\`${killer}\``;

  const desc = [
    `# ⚔️ Kill Logs`,
    `${victimLink} was killed by ${killerLink}.`,
    `<t:${ts}:F> (<t:${ts}:R>)`
  ];

  if (isSuspectedRdm) {
    desc.push(`⚠️ **Suspected RDM Warning:** ${rdmReason || 'Multiple rapid kills detected without active roleplay scenario.'}`);
  }

  const statRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`kill_stats_${killerId || killer}`)
      .setLabel('Player Statistics')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📊'),
    new ButtonBuilder()
      .setCustomId(`kill_history_${killerId || killer}`)
      .setLabel('Kill History')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📜')
  );

  const container = createComponentsV2Container({
    type: 'kill_log',
    accentColor: isSuspectedRdm ? 0xDA373C : 0x00A8FF,
    description: desc.join('\n\n'),
    actionRows: [statRow]
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Off-Duty Command Detection Log (Bottom banner)
 */
export function createOffDutyCommandLogV2({
  staffUser = null,
  staffMember = null,
  robloxUsername = 'Unknown',
  command = ':cmds',
  timestamp = null
}) {
  const staffMention = staffUser ? `<@${staffUser.id}>` : (staffMember ? `<@${staffMember.id}>` : `@${robloxUsername}`);
  const ts = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);

  const desc = [
    `# 🚨 Off-Duty Command Detected`,
    `**Staff:** ${staffMention}`,
    `**Roblox:** \`${robloxUsername}\``,
    `**Command:** \`${command}\``,
    `**Status:** \`Not on shift\``,
    `**Time:** <t:${ts}:R> (<t:${ts}:F>)`
  ].join('\n\n');

  const container = createComponentsV2Container({
    type: 'offduty_command_log',
    accentColor: 0xDA373C,
    description: desc
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Leave of Absence (LOA) Request & Decision Log (Bottom banner)
 */
export function createLoaRequestV2({
  requestNumber = '0001',
  roleDisplay = '@High Rank',
  staffUser,
  robloxUsername = 'Not Linked',
  fromDate,
  untilDate,
  days = 5,
  reason,
  requestedFrom = 'Discord',
  requestedAt = null,
  status = 'PENDING',
  reviewerUser = null,
  denialReason = null
}) {
  const staffMention = staffUser ? `<@${staffUser.id}>` : '@StaffMember';
  const staffTag = staffUser?.tag || staffUser?.username || 'StaffMember';
  const ts = requestedAt ? Math.floor(new Date(requestedAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const statusFormatted = status === 'ACCEPTED' ? 'Accepted' : status === 'DENIED' ? 'Denied' : 'Pending Review';

  const desc = [
    `# 📋 Leave of Absence Request`,
    `${roleDisplay} · Request #${requestNumber} · **${statusFormatted}**`,
    `**Staff Member:** ${staffMention} (\`${staffTag}\`)`,
    robloxUsername ? `**Roblox:** \`${robloxUsername}\`` : null,
    `**From:** \`${fromDate}\``,
    `**Until:** \`${untilDate}\` · \`${days} days\``,
    `**Reason:** ${reason}`,
    `**Requested From:** \`${requestedFrom}\``,
    `**Requested:** <t:${ts}:F>`,
    reviewerUser ? `**${status === 'ACCEPTED' ? 'Accepted by:' : 'Reviewed by:'}** <@${reviewerUser.id}>` : null,
    denialReason ? `**Denial Reason:** "${denialReason}"` : null
  ].filter(Boolean).join('\n\n');

  const actionRows = [];
  if (status === 'PENDING') {
    actionRows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`loa_accept_${requestNumber}`).setLabel('Approve LOA').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId(`loa_deny_${requestNumber}`).setLabel('Deny LOA').setStyle(ButtonStyle.Danger).setEmoji('❌')
      )
    );
  }

  const container = createComponentsV2Container({
    type: 'loa_request',
    accentColor: status === 'ACCEPTED' ? 0x23A55A : (status === 'DENIED' ? 0xDA373C : 0x00A8FF),
    description: desc,
    actionRows
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Security Staff Member Departure Log (Bottom banner)
 */
export function createStaffDepartureLogV2({
  caseId = 'SEC-0001',
  rolesDisplay = '@Staff Team',
  user,
  robloxId = 'N/A',
  howLeft = 'Left on their own',
  actionsTaken = ['Removed admin permissions.', 'Removed moderator permissions.'],
  resolved = false,
  resolvedBy = null,
  resolvedAt = null
}) {
  const userTag = user?.tag || user?.username || 'StaffMember';
  const userMention = user?.id ? `<@${user.id}>` : `@${userTag}`;
  const actionsList = actionsTaken.map(a => `- ${a}`).join('\n');

  const lines = [
    `# 🚨 Staff Member Left!`,
    `${rolesDisplay}`,
    `Staff member has left the server while having \`${rolesDisplay}\`.`,
    `**Username:** \`${userTag}\` (${userMention})`,
    `**Roblox:** \`${robloxId}\``,
    `**How They Left:** \`${howLeft}\``,
    `**Actions Taken:**\n${actionsList}`
  ];

  if (resolved && resolvedBy) {
    const resTs = resolvedAt ? Math.floor(new Date(resolvedAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
    lines.push(`**Resolved by:** <@${resolvedBy.id}> (<t:${resTs}:R>)`);
  }

  const actionRows = [];
  if (!resolved) {
    actionRows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`security_resolve_${caseId}`).setLabel('Resolve Case').setStyle(ButtonStyle.Success).setEmoji('🛡️')
      )
    );
  }

  const container = createComponentsV2Container({
    type: 'staff_departure_log',
    accentColor: resolved ? 0x23A55A : 0xDA373C,
    description: lines.join('\n\n'),
    actionRows
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Ticket Channel Greeting / Welcome Message (Top & Bottom banners)
 */
export function createTicketWelcomeV2({
  ticketId = '0001',
  category = 'General Support',
  creator,
  assignedStaffRole = 'Support Team',
  initialInquiry = 'General member inquiry',
  robloxUser = null
}) {
  const creatorMention = `<@${creator.id}>`;
  const creatorTag = creator.tag || creator.username;
  const now = Math.floor(Date.now() / 1000);

  const desc = [
    `# 🎫 West Virginia State Roleplay · Support Ticket`,
    `Welcome, ${creatorMention}! Your support ticket has been created successfully. A member of our **${assignedStaffRole}** will assist you shortly.`,
    '',
    `• **Ticket Number:** \`#${ticketId}\``,
    `• **Category:** **${category}**`,
    `• **Ticket Creator:** ${creatorMention} (\`${creatorTag}\`)`,
    `• **Assigned Role:** \`${assignedStaffRole}\``,
    `• **Opened:** <t:${now}:F>`,
    robloxUser ? `• **Roblox Profile:** [${robloxUser.username}](${robloxUser.profileUrl || `https://www.roblox.com/users/${robloxUser.id}/profile`}) (\`${robloxUser.id}\`)` : null,
    '',
    `**Initial Inquiry:**`,
    `> ${initialInquiry}`
  ].filter(Boolean).join('\n');

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_claim_${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('🎫'),
    new ButtonBuilder().setCustomId(`ticket_unclaim_${ticketId}`).setLabel('Unclaim').setStyle(ButtonStyle.Secondary).setEmoji('↩️'),
    new ButtonBuilder().setCustomId(`ticket_close_${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_add_member_${ticketId}`).setLabel('Add Member').setStyle(ButtonStyle.Primary).setEmoji('➕'),
    new ButtonBuilder().setCustomId(`ticket_remove_member_${ticketId}`).setLabel('Remove Member').setStyle(ButtonStyle.Secondary).setEmoji('➖'),
    new ButtonBuilder().setCustomId(`ticket_rename_${ticketId}`).setLabel('Rename').setStyle(ButtonStyle.Secondary).setEmoji('✏️')
  );

  const container = createComponentsV2Container({
    type: 'ticket',
    accentColor: 0x00A8FF,
    description: desc,
    actionRows: [row1, row2]
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Ticket Closure Log (Bottom banner)
 */
export function createTicketClosureLogV2({
  ticketId = '0001',
  category = 'General Support',
  handledBy = null,
  closedBy = null,
  openedAt = null,
  closedAt = null,
  duration = '20m',
  messageCount = 30,
  transcriptUrl = null
}) {
  const handledDisplay = handledBy?.id ? `<@${handledBy.id}>` : (handledBy?.username ? `@${handledBy.username}` : '@Staff');
  const closedDisplay = closedBy?.id ? `<@${closedBy.id}>` : (closedBy?.username ? `@${closedBy.username}` : '@Moderator');
  const openedTs = openedAt ? Math.floor(new Date(openedAt).getTime() / 1000) : Math.floor((Date.now() - 3600000) / 1000);
  const closedTs = closedAt ? Math.floor(new Date(closedAt).getTime() / 1000) : Math.floor(Date.now() / 1000);

  const desc = [
    `# 📑 Ticket #${ticketId} — ${category}`,
    `**${category}** ticket has been closed.`,
    `**Handled By:** ${handledDisplay}`,
    `**Closed By:** ${closedDisplay}`,
    `**Opened:** <t:${openedTs}:F>`,
    `**Closed:** <t:${closedTs}:R>`,
    `**Duration:** \`${duration}\``,
    `**Messages Sent:** \`${messageCount} messages\``
  ].join('\n\n');

  const actionRows = [];
  if (transcriptUrl) {
    const fullUrl = transcriptUrl.startsWith('http') ? transcriptUrl : `https://wvrp-transcripts.local${transcriptUrl}`;
    actionRows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Online Transcript').setStyle(ButtonStyle.Link).setURL(fullUrl).setEmoji('📑')
      )
    );
  }

  const container = createComponentsV2Container({
    type: 'ticket_closure_log',
    accentColor: 0x00A8FF,
    description: desc,
    actionRows
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Application Hub Panel with Category Select (Top & Bottom banners)
 */
export function createApplicationPanelV2() {
  const desc = [
    `# 📝 West Virginia State Roleplay · Recruitment Hub`,
    `### Official Staff & Department Application Portal`,
    '',
    `Welcome to the official **West Virginia State Roleplay** recruitment system. Select an application category from the menu below to open your private questionnaire channel.`,
    '',
    `• **15 Comprehensive Questions:** Evaluates situational handling, server protocol, and professionalism.`,
    `• **Writing Verification:** Answers are analyzed via Sapling SPaG and Groq AI for grammar clarity.`,
    `• **Auto-Save:** Progress saves after each answer. You can resume at any time.`,
    `• **Prompt Human Review:** Department High Command reviews all submissions directly.`,
    '',
    `*Select your desired department or staff category below to begin:*`
  ].join('\n');

  const selectMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('app_select_dept')
      .setPlaceholder('Choose an Application Category...')
      .addOptions([
        {
          label: 'Staff Application',
          value: 'staff',
          description: 'Apply for Trial Moderator & Community Staff Team',
          emoji: '🛡️'
        },
        {
          label: 'Media Team Application',
          value: 'media',
          description: 'Apply for Content Creation, Cinematography, & Photography',
          emoji: '🎬'
        },
        {
          label: 'West Virginia State Police (WVSP)',
          value: 'wvsp',
          description: 'Statewide highway patrol and tactical law enforcement',
          emoji: '🚓'
        },
        {
          label: 'Kanawha County Sheriff Office (KCSO)',
          value: 'kcso',
          description: 'County patrol, investigations, and tactical support',
          emoji: '⭐'
        },
        {
          label: 'Fire & Rescue / EMS',
          value: 'fire',
          description: 'Fire suppression, rescue operations, and paramedicine',
          emoji: '🚒'
        },
        {
          label: 'Ban Appeal Application',
          value: 'appeal',
          description: 'Submit an official appeal for server or in-game bans',
          emoji: '⚖️'
        }
      ])
  );

  const container = createComponentsV2Container({
    type: 'application',
    accentColor: 0x00A8FF,
    description: desc,
    actionRows: [selectMenu]
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Application Channel Welcome Message (Top & Bottom banners)
 */
export function createApplicationWelcomeV2({
  appId = 'APP-0001',
  applicant,
  robloxUser = null,
  category = 'Staff Application',
  assignedReviewerRole = 'Recruitment Team'
}) {
  const applicantMention = `<@${applicant.id}>`;
  const applicantTag = applicant.tag || applicant.username;
  const robloxLink = robloxUser?.id
    ? `[${robloxUser.username}](https://www.roblox.com/users/${robloxUser.id}/profile) (\`${robloxUser.id}\`)`
    : `\`${robloxUser?.username || 'Not Linked'}\``;

  const desc = [
    `# 📝 West Virginia State Roleplay · Private Application`,
    `Welcome, ${applicantMention}! Your recruitment channel for **${category}** has been established.`,
    '',
    `• **Applicant Account:** ${applicantMention} (\`${applicantTag}\`)`,
    `• **Roblox Profile:** ${robloxLink}`,
    `• **Application Category:** **${category}**`,
    `• **Reviewer Role:** \`${assignedReviewerRole}\``,
    `• **Application ID:** \`${appId}\``,
    '',
    `Please answer all **15 questions** in full sentences. Avoid shorthand, emojis, and external assistance. Click **Start Application** below to begin Question 1.`
  ].join('\n');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`app_q_answer_${appId}_0`)
      .setLabel('Start Application (Question 1/15)')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('✍️')
  );

  const container = createComponentsV2Container({
    type: 'application',
    accentColor: 0x00A8FF,
    description: desc,
    actionRows: [row]
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Application Result DM (Top & Bottom banners)
 */
export function createApplicationResultDmV2({
  decision = 'ACCEPTED', // 'ACCEPTED' | 'DENIED'
  category = 'Staff Application',
  applicant,
  reviewer,
  reason = null,
  date = null
}) {
  const isAccepted = decision.toUpperCase() === 'ACCEPTED';
  const ts = date ? Math.floor(new Date(date).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const applicantMention = applicant?.id ? `<@${applicant.id}>` : '@Applicant';
  const reviewerMention = reviewer?.id ? `<@${reviewer.id}>` : (reviewer?.username ? `@${reviewer.username}` : '@RecruitmentStaff');

  const title = isAccepted
    ? '🎉 Application Approved — West Virginia State Roleplay'
    : '❌ Application Decision — West Virginia State Roleplay';

  const desc = [
    `# ${title}`,
    `Hello ${applicantMention},`,
    '',
    `Your application for **${category}** has been **${decision}** by ${reviewerMention}.`,
    '',
    `• **Application Category:** \`${category}\``,
    `• **Decision:** \`${decision}\``,
    `• **Applicant:** ${applicantMention}`,
    `• **Reviewer:** ${reviewerMention}`,
    `• **Date:** <t:${ts}:F>`,
    reason ? `• **Notes / Reason:** ${reason}` : null,
    '',
    isAccepted
      ? '📌 **Next Steps:** Please report to your assigned lobby within 7 days to complete orientation and receive your roles.'
      : '📌 **Notice:** You may reapply in 14 days. Thank you for your interest in West Virginia State Roleplay.'
  ].filter(Boolean).join('\n');

  const container = createComponentsV2Container({
    type: 'application_result_dm',
    accentColor: isAccepted ? 0x23A55A : 0xDA373C,
    description: desc
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Promotion Log (Bottom banner)
 */
export function createPromotionLogV2({
  promotionId = 'PROM-0001',
  staffUser,
  previousRank = 'Junior Staff',
  newRank = 'Senior Staff',
  promotedBy,
  reason = 'Exceptional activity, shift performance, and professionalism',
  timestamp = null,
  robloxUser = null
}) {
  const ts = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const staffMention = staffUser ? `<@${staffUser.id}>` : '@StaffMember';
  const promoterMention = promotedBy ? `<@${promotedBy.id}>` : '@Leadership';
  const robloxLink = robloxUser?.id
    ? `[${robloxUser.username}](https://www.roblox.com/users/${robloxUser.id}/profile) (\`${robloxUser.id}\`)`
    : (robloxUser?.username ? `\`${robloxUser.username}\`` : '`Not Linked`');

  const desc = [
    `# 🎖️ Staff Promotion`,
    `**Promotion ID:** \`${promotionId}\``,
    `**Staff Member:** ${staffMention}`,
    `**Roblox:** ${robloxLink}`,
    `**Previous Rank:** \`${previousRank}\``,
    `**New Rank:** **${newRank}**`,
    `**Promoted by:** ${promoterMention}`,
    `**Reason:** ${reason}`,
    `**Timestamp:** <t:${ts}:F> (<t:${ts}:R>)`
  ].join('\n\n');

  const container = createComponentsV2Container({
    type: 'promotion',
    accentColor: 0x00A8FF,
    description: desc
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Demotion Log (Bottom banner)
 */
export function createDemotionLogV2({
  demotionId = 'DEM-0001',
  staffUser,
  previousRank = 'Senior Staff',
  newRank = 'Junior Staff',
  demotedBy,
  reason = 'Failure to meet weekly staff quota requirements',
  timestamp = null
}) {
  const ts = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const staffMention = staffUser ? `<@${staffUser.id}>` : '@StaffMember';
  const demoterMention = demotedBy ? `<@${demotedBy.id}>` : '@InternalAffairs';

  const desc = [
    `# ⚠️ Staff Demotion`,
    `**Demotion ID:** \`${demotionId}\``,
    `**Staff Member:** ${staffMention}`,
    `**Previous Rank:** \`${previousRank}\``,
    `**New Rank:** **${newRank}**`,
    `**Demoted by:** ${demoterMention}`,
    `**Reason:** ${reason}`,
    `**Timestamp:** <t:${ts}:F> (<t:${ts}:R>)`
  ].join('\n\n');

  const container = createComponentsV2Container({
    type: 'promotion',
    accentColor: 0xDA373C,
    description: desc
  });

  return createV2MessagePayload(container);
}

/**
 * Components V2: Infraction Log (Bottom banner)
 */
export function createInfractionLogV2({
  infractionId = 'INF-0001',
  staffUser,
  robloxUsername = 'Not Linked',
  discordId = null,
  issuerUser,
  punishment = 'Verbal Warning',
  reason = 'Policy Violation',
  evidence = null,
  timestamp = null,
  appealable = true,
  status = 'ACTIVE'
}) {
  const ts = timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const staffMention = staffUser ? `<@${staffUser.id}>` : (discordId ? `<@${discordId}>` : '@StaffMember');
  const staffTag = staffUser?.tag || staffUser?.username || 'StaffMember';
  const issuerMention = issuerUser ? `<@${issuerUser.id}>` : '@Moderator';

  const desc = [
    `# ⚖️ Staff Infraction Notice — ${infractionId}`,
    `**Infraction ID:** \`${infractionId}\``,
    `**Staff Member:** ${staffMention} (\`${staffTag}\`)`,
    robloxUsername ? `**Roblox Username:** \`${robloxUsername}\`` : null,
    discordId ? `**Discord ID:** \`${discordId}\`` : null,
    `**Issuing Moderator:** ${issuerMention}`,
    `**Punishment Type:** \`${punishment}\``,
    `**Reason:** "${reason}"`,
    evidence ? `**Evidence:** ${evidence}` : null,
    `**Date & Time:** <t:${ts}:F>`,
    `**Appeal Status:** \`${appealable ? 'Appealable via /appeal' : 'Non-Appealable'}\``,
    `**Status:** \`${status}\``
  ].filter(Boolean).join('\n\n');

  const actionRows = [];
  if (status === 'ACTIVE') {
    actionRows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`infraction_revoke_${infractionId}`).setLabel('Undo / Revoke').setStyle(ButtonStyle.Danger).setEmoji('↩️')
      )
    );
  }

  const container = createComponentsV2Container({
    type: 'infraction',
    accentColor: 0xDA373C,
    description: desc,
    actionRows
  });

  return createV2MessagePayload(container);
}

export function getOrdinalSuffix(i) {
  const num = Math.abs(parseInt(String(i), 10) || 1);
  const j = num % 10,
        k = num % 100;
  if (j === 1 && k !== 11) return `${num.toLocaleString()}st`;
  if (j === 2 && k !== 12) return `${num.toLocaleString()}nd`;
  if (j === 3 && k !== 13) return `${num.toLocaleString()}rd`;
  return `${num.toLocaleString()}th`;
}

export default WvrpEmbedBuilder;

