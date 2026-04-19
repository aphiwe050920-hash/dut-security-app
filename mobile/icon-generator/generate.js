const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// DUT Security logo SVG design
const logoSVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024"
  xmlns="http://www.w3.org/2000/svg">

  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#CC0000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#990000;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="12"
        flood-color="rgba(0,0,0,0.5)"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bgGrad)" rx="180"/>

  <!-- Outer ring -->
  <circle cx="512" cy="512" r="460"
    fill="none" stroke="#CC0000"
    stroke-width="6" opacity="0.3"/>
  <circle cx="512" cy="512" r="440"
    fill="none" stroke="#CC0000"
    stroke-width="2" opacity="0.2"/>

  <!-- Shield body -->
  <path d="M512 160
    L340 230 L340 500
    C340 620 420 710 512 760
    C604 710 684 620 684 500
    L684 230 Z"
    fill="url(#shieldGrad)"
    filter="url(#shadow)"/>

  <!-- Shield inner highlight -->
  <path d="M512 200
    L370 262 L370 500
    C370 604 442 684 512 728
    C582 684 654 604 654 500
    L654 262 Z"
    fill="none" stroke="rgba(255,255,255,0.15)"
    stroke-width="3"/>

  <!-- Lock icon on shield -->
  <!-- Lock body -->
  <rect x="462" y="460" width="100" height="80"
    rx="10" fill="white" opacity="0.95"/>
  <!-- Lock shackle -->
  <path d="M482 460 L482 430
    C482 400 542 400 542 430
    L542 460"
    fill="none" stroke="white"
    stroke-width="20" stroke-linecap="round"
    opacity="0.95"/>
  <!-- Lock keyhole -->
  <circle cx="512" cy="492" r="12" fill="#CC0000"/>
  <rect x="506" y="492" width="12" height="20"
    rx="3" fill="#CC0000"/>

  <!-- DUT text -->
  <text x="512" y="840"
    font-family="Arial Black, Arial"
    font-weight="900"
    font-size="96"
    fill="white"
    text-anchor="middle"
    letter-spacing="8">DUT</text>

  <!-- CAMPUS SECURITY text -->
  <text x="512" y="910"
    font-family="Arial, sans-serif"
    font-weight="700"
    font-size="42"
    fill="#CC0000"
    text-anchor="middle"
    letter-spacing="6">CAMPUS SECURITY</text>

  <!-- Decorative dots -->
  <circle cx="300" cy="870" r="6" fill="#CC0000" opacity="0.6"/>
  <circle cx="724" cy="870" r="6" fill="#CC0000" opacity="0.6"/>
  <circle cx="270" cy="870" r="4" fill="#CC0000" opacity="0.3"/>
  <circle cx="754" cy="870" r="4" fill="#CC0000" opacity="0.3"/>

</svg>`;

// Splash screen SVG
const splashSVG = `
<svg width="1284" height="2778" viewBox="0 0 1284 2778"
  xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#CC0000"/>
      <stop offset="100%" style="stop-color:#990000"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1284" height="2778" fill="url(#bgGrad)"/>

  <!-- Decorative circles -->
  <circle cx="642" cy="1389" r="500"
    fill="none" stroke="#CC0000"
    stroke-width="2" opacity="0.1"/>
  <circle cx="642" cy="1389" r="560"
    fill="none" stroke="#CC0000"
    stroke-width="1" opacity="0.07"/>

  <!-- Shield -->
  <path d="M642 1100
    L490 1160 L490 1360
    C490 1450 560 1520 642 1560
    C724 1520 794 1450 794 1360
    L794 1160 Z"
    fill="url(#shieldGrad)"/>

  <!-- Lock on shield -->
  <rect x="602" y="1340" width="80" height="64"
    rx="8" fill="white" opacity="0.95"/>
  <path d="M618 1340 L618 1316
    C618 1292 666 1292 666 1316
    L666 1340"
    fill="none" stroke="white"
    stroke-width="16" stroke-linecap="round"
    opacity="0.95"/>
  <circle cx="642" cy="1364" r="10" fill="#CC0000"/>
  <rect x="637" y="1364" width="10" height="16"
    rx="2" fill="#CC0000"/>

  <!-- DUT text -->
  <text x="642" y="1680"
    font-family="Arial Black, Arial"
    font-weight="900"
    font-size="120"
    fill="white"
    text-anchor="middle"
    letter-spacing="10">DUT</text>

  <!-- Campus Security text -->
  <text x="642" y="1760"
    font-family="Arial, sans-serif"
    font-weight="700"
    font-size="52"
    fill="#CC0000"
    text-anchor="middle"
    letter-spacing="6">CAMPUS SECURITY</text>

  <!-- Tagline -->
  <text x="642" y="1830"
    font-family="Arial, sans-serif"
    font-size="36"
    fill="rgba(255,255,255,0.4)"
    text-anchor="middle"
    letter-spacing="3">Stay Safe. Stay Connected.</text>

</svg>`;

const assetsDir = path.join(__dirname, '..', 'assets');

const generateIcons = async () => {
  console.log('🎨 Generating DUT Security icons...\n');

  try {
    // 1. App Icon (1024x1024)
    await sharp(Buffer.from(logoSVG))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✅ icon.png generated (1024x1024)');

    // 2. Adaptive Icon (1024x1024)
    await sharp(Buffer.from(logoSVG))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✅ adaptive-icon.png generated (1024x1024)');

    // 3. Splash Screen (1284x2778)
    await sharp(Buffer.from(splashSVG))
      .resize(1284, 2778)
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✅ splash.png generated (1284x2778)');

    // 4. Favicon (48x48)
    await sharp(Buffer.from(logoSVG))
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✅ favicon.png generated (48x48)');

    // 5. Notification icon (96x96 white on transparent)
    const notifSVG = `
    <svg width="96" height="96" viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M48 8 L20 20 L20 52
        C20 68 32 80 48 88
        C64 80 76 68 76 52
        L76 20 Z"
        fill="white"/>
    </svg>`;

    await sharp(Buffer.from(notifSVG))
      .resize(96, 96)
      .png()
      .toFile(path.join(assetsDir, 'notification-icon.png'));
    console.log('✅ notification-icon.png generated (96x96)');

    console.log('\n🎉 All icons generated successfully!');
    console.log('📁 Saved to: mobile/assets/');
    console.log('\nYour app will now show the DUT Security logo!');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
  }
};

generateIcons();