import fs from 'fs';
import path from 'path';

const titles = [
  { file: 'wvrp-banner-top.svg', title: 'WEST VIRGINIA', sub: 'ROLEPLAY COMMUNITY', badge: 'WVRP' },
  { file: 'banner-assistance.svg', title: 'ASSISTANCE', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'SUPPORT' },
  { file: 'banner-applications.svg', title: 'APPLICATIONS', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'CAREERS' },
  { file: 'banner-marketplace.svg', title: 'MARKETPLACE', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'STORE' },
  { file: 'banner-regulations.svg', title: 'REGULATIONS', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'RULES' },
  { file: 'banner-sessions.svg', title: 'SESSIONS', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'IN-GAME' },
  { file: 'banner-infractions.svg', title: 'INFRACTIONS', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'IA & DISCIPLINE' },
  { file: 'banner-promotions.svg', title: 'PROMOTIONS', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'HONORS' },
  { file: 'banner-departments.svg', title: 'DEPARTMENTS', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'WHITELISTS' },
  { file: 'banner-training.svg', title: 'STAFF TRAINING', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'ACADEMY' },
  { file: 'banner-feedback.svg', title: 'STAFF FEEDBACK', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'REVIEWS' },
  { file: 'banner-dashboard.svg', title: 'STAFF DASHBOARD', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'INTERNAL' },
  { file: 'banner-welcome.svg', title: 'WELCOME', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'COMMUNITY' },
  { file: 'banner-boost.svg', title: 'SERVER BOOST', sub: 'WEST VIRGINIA ROLEPLAY', badge: 'SUPPORTERS' },
  { file: 'banner-verification.svg', title: 'VERIFICATION', sub: 'ROBLOX & BLOXLINK', badge: 'ID SYSTEM' },
  { file: 'banner-fastpass.svg', title: 'FAST PASS', sub: 'STAFF & DEPARTMENT', badge: 'EXPEDITE' }
];

const bannerDir = path.resolve('public/banners');
if (!fs.existsSync(bannerDir)) fs.mkdirSync(bannerDir, { recursive: true });

for (const item of titles) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 240" width="1000" height="240">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#021226"/>
      <stop offset="25%" stop-color="#072b54"/>
      <stop offset="50%" stop-color="#0d4685"/>
      <stop offset="75%" stop-color="#072b54"/>
      <stop offset="100%" stop-color="#021226"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="50%" stop-color="#4facfe"/>
      <stop offset="100%" stop-color="#00f2fe"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#e0f7ff"/>
      <stop offset="100%" stop-color="#80d4ff"/>
    </linearGradient>
    <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1000" height="240" fill="url(#bg)" rx="8"/>

  <!-- Abstract Tech & Mountain Lines -->
  <path d="M0,0 L260,240 L340,240 L80,0 Z" fill="#00e5ff" opacity="0.10"/>
  <path d="M660,0 L920,240 L1000,240 L740,0 Z" fill="#00e5ff" opacity="0.10"/>
  <path d="M0,230 L1000,230" stroke="#00e5ff" stroke-width="4" opacity="0.85"/>
  <path d="M0,8 L1000,8" stroke="#00e5ff" stroke-width="2" opacity="0.4"/>

  <!-- Mountain Silhouette Backdrop for West Virginia -->
  <path d="M50,230 L180,120 L270,170 L400,80 L500,150 L620,70 L740,160 L870,100 L970,230 Z" fill="#041a38" opacity="0.7"/>
  <path d="M120,230 L230,150 L340,195 L460,110 L580,175 L700,95 L820,185 L920,140 L1000,230 Z" fill="#082b59" opacity="0.5"/>

  <!-- Discord & Community Header URL -->
  <text x="500" y="45" fill="#64b5f6" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" letter-spacing="8" text-anchor="middle">DISCORD.GG / WVRP</text>

  <!-- Big Title -->
  <text x="500" y="132" fill="url(#textGrad)" font-family="system-ui, -apple-system, sans-serif" font-size="58" font-weight="950" letter-spacing="6" text-anchor="middle" filter="url(#textGlow)">${item.title}</text>

  <!-- Subtitle Tag / Pill -->
  <rect x="360" y="160" width="280" height="34" rx="17" fill="#031b38" stroke="#00e5ff" stroke-width="1.8" opacity="0.95"/>
  <text x="500" y="182" fill="#00e5ff" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" letter-spacing="4" text-anchor="middle">${item.sub}</text>

  <!-- Side Emblems -->
  <g transform="translate(80, 85)">
    <circle cx="25" cy="25" r="32" fill="#082245" stroke="#00e5ff" stroke-width="2.5"/>
    <text x="25" y="32" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">WV</text>
  </g>

  <g transform="translate(865, 85)">
    <circle cx="25" cy="25" r="32" fill="#082245" stroke="#00e5ff" stroke-width="2.5"/>
    <text x="25" y="32" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle">RP</text>
  </g>
</svg>`;
  fs.writeFileSync(path.join(bannerDir, item.file), svg);
}

console.log('All 12 banner SVGs created successfully!');
