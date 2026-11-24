// news-image-20261123-v9 — pictorial broadsheet for Monday 23 November 2026.
// Fresh build: Satori + resvg-js, Inter (bundled woff), deterministic render.
// 32 stories (3 leads + 10 pictured + 19 also-on), 9 regions. 1024x1024.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fontkit = require('fontkit');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const W = 1024;
const H = 1024;

const PAPER = '#f6f1e5';
const PANEL = '#fffdf6';
const INK = '#17130c';
const MUTED = '#6b6252';
const RULE = '#d8cdb2';
const RED = '#b42318';
const TEAL = '#0f766e';
const NAVY = '#173a5e';
const GOLD = '#a16207';
const BLUE = '#1d4ed8';

const REGION_COLOR = {
  EUROPE: '#1d4ed8',
  'MIDDLE EAST': '#b45309',
  AFRICA: '#15803d',
  'ASIA-PACIFIC': '#0e7490',
  'SOUTH ASIA': '#be185d',
  'NORTH AMERICA': '#6d28d9',
  'LATIN AMERICA': '#b91c1c',
  OCEANIA: '#0f766e',
  GLOBAL: '#475569',
};

// ---------- fonts ----------
const FONT_FILES = { 400: 'inter-latin-400-normal.woff', 700: 'inter-latin-700-normal.woff', 800: 'inter-latin-800-normal.woff', 900: 'inter-latin-900-normal.woff' };
const fkFonts = {};
const satoriFonts = [];
for (const [weight, file] of Object.entries(FONT_FILES)) {
  const data = fs.readFileSync(path.join(__dirname, 'fonts', file));
  fkFonts[weight] = fontkit.create(data);
  satoriFonts.push({ name: 'Inter', data, weight: Number(weight), style: 'normal' });
}
function textWidth(text, size, weight) {
  const f = fkFonts[weight] || fkFonts[400];
  return (f.layout(text).advanceWidth / f.unitsPerEm) * size;
}

// ---------- text registry (for the validator) ----------
const blocks = [];
function regBlock(id, x, y, w, h, size, weight, lines) {
  blocks.push({ id, x, y, w, h, size, weight, lines });
}

// Wrap rich segments [{text, weight, color}] into lines fitting maxW.
// Returns lines: [{segs: [{text, weight, color}], width}]. Throws if > maxLines.
function wrapSegs(segments, size, maxW, maxLines, id) {
  const words = [];
  for (const s of segments) {
    for (const w of s.text.split(/\s+/).filter(Boolean)) {
      words.push({ text: w, weight: s.weight, color: s.color, w: textWidth(w, size, s.weight) });
    }
  }
  const spaceW = (wt) => textWidth(' ', size, wt);
  const lines = [];
  let cur = [];
  let curW = 0;
  for (const word of words) {
    const add = (cur.length ? spaceW(cur[cur.length - 1].weight) : 0) + word.w;
    if (cur.length && curW + add > maxW) {
      lines.push({ segs: cur, width: curW });
      cur = [word];
      curW = word.w;
    } else {
      curW += add;
      cur.push(word);
    }
  }
  if (cur.length) lines.push({ segs: cur, width: curW });
  if (lines.length > maxLines) {
    throw new Error(`WRAP OVERFLOW ${id}: ${lines.length} lines > ${maxLines} for "${segments.map((s) => s.text).join(' ')}"`);
  }
  return lines;
}

// ---------- Satori helpers ----------
const e = React.createElement;
function D(style, ...kids) {
  return e('div', { style: { display: 'flex', ...style } }, ...kids);
}
function abs(x, y, w, h, style = {}, ...kids) {
  return D({ position: 'absolute', left: x, top: y, width: w, height: h, ...style }, ...kids);
}
// Render wrapped text lines as absolutely positioned divs; register the block.
// Each run of same-weight/same-colour words is its OWN single-text-node div:
// Satori drops the space between sibling spans inside a flex container, and
// mis-lays-out mixed-weight inline spans, so runs are positioned by fontkit
// measurement instead of relying on Satori's inline layout.
function T(id, x, y, w, segments, size, weight, { lh = null, maxLines = 4, align = 'left', color = INK } = {}) {
  const segs = segments.map((s) => (typeof s === 'string' ? { text: s, weight, color } : { weight, color, ...s }));
  const lineHeight = lh || Math.round(size * 1.22);
  const lines = wrapSegs(segs, size, w, maxLines, id);
  regBlock(id, x, y, w, lines.length * lineHeight, size, weight,
    lines.map((l) => ({ text: l.segs.map((s) => s.text).join(' '), width: l.width })));
  const out = [];
  lines.forEach((line, i) => {
    const runs = [];
    for (const s of line.segs) {
      const last = runs[runs.length - 1];
      if (last && last.weight === s.weight && last.color === s.color) last.words.push(s.text);
      else runs.push({ weight: s.weight, color: s.color, words: [s.text] });
    }
    let cx = x;
    if (align === 'center') cx = x + (w - line.width) / 2;
    else if (align === 'right') cx = x + (w - line.width);
    runs.forEach((run, j) => {
      const runText = run.words.join(' ');
      const runW = textWidth(runText, size, run.weight);
      out.push(e('div', {
        key: `${id}-${i}-${j}`,
        style: { position: 'absolute', left: cx, top: y + i * lineHeight, fontSize: size, fontFamily: 'Inter', fontWeight: run.weight, color: run.color, lineHeight: `${lineHeight}px` },
      }, runText));
      cx += runW + (j < runs.length - 1 ? textWidth(' ', size, run.weight) : 0);
    });
  });
  return out;
}
function rule(x, y, w, h = 1, color = RULE) {
  return abs(x, y, w, h, { backgroundColor: color });
}

// ---------- story data (from the v8 README story list) ----------
const LEADS = [
  {
    kicker: 'LEAD 1 — CLIMATE · ANTALYA, TURKEY', color: TEAL,
    head: ['COP31 collapses —', 'no deal'],
    deck: 'After record two days of overtime, 190+ nations fail to agree a pact. The EU and ~130 parties reject a text with no mention of fossil fuels. First COP collapse since 2009.',
    foot: 'ANTALYA · 90 BACK ELECTRIFICATION · 47 JOIN METHANE CUT',
  },
  {
    kicker: 'LEAD 2 — WAR AT SEA · BENGHAZI, LIBYA', color: RED,
    head: ['Ukraine sinks Russian', 'warship in Libya'],
    deck: 'Seven sea drones sink the corvette Merkury at Benghazi naval base; a second Russian-linked vessel is hit and 10 people are hurt. The war reaches the Mediterranean, 1,600 km from Ukraine.',
    foot: 'BENGHAZI · 1,600 KM FROM UKRAINE',
  },
  {
    kicker: 'LEAD 3 — UKRAINE · DYMER, KYIV REGION', color: RED,
    head: ['Strike on Dymer', 'kills 11'],
    deck: 'A Russian drone strike partly collapses a five-storey block north of Kyiv. A 7-year-old boy is pulled alive after 14 hours, an elderly woman after 22. Fifteen are killed across the Kyiv region.',
    foot: 'DYMER · BOY, 7, ALIVE AFTER 14 HOURS',
  },
];

const PICTURED = [
  { region: 'EUROPE', icon: 'ship', head: 'Sparta II ablaze in the Baltic', deck: 'Russian shadow-fleet tanker burns; drifts toward Finland.' },
  { region: 'EUROPE', icon: 'drone', head: 'Germany tests suicide drones', deck: "Berlin's first live test of one-way attack drones." },
  { region: 'EUROPE', icon: 'cross', head: 'NHS trials AI breast screening', deck: 'AI reads mammograms in a trial of 700,000 women.' },
  { region: 'MIDDLE EAST', icon: 'tanker', head: "Iran vows 'all means' vs US blockade", deck: 'Tehran threatens retaliation as two tankers burn.' },
  { region: 'AFRICA', icon: 'building', head: 'Khartoum strikes damage UN building', deck: 'Homes destroyed; a UN building is damaged.' },
  { region: 'AFRICA', icon: 'boat', head: 'Bayelsa boat toll rises to 29', deck: 'Toll from the 20 Nov capsizing keeps rising.' },
  { region: 'ASIA-PACIFIC', icon: 'chip', head: 'S. Korea exports top $1T', deck: 'First $1 trillion export year; chips up 294%.' },
  { region: 'ASIA-PACIFIC', icon: 'flame', head: 'Banten fire: 24 bodies found', deck: 'Fire tears through a Banten neighbourhood.' },
  { region: 'NORTH AMERICA', icon: 'ballot', head: 'Democrats win 258 House seats', deck: 'Democrats take the House, best since 1992.' },
  { region: 'NORTH AMERICA', icon: 'coin', head: 'The penny ends after 232 years', deck: 'The US Mint strikes its last one-cent coin.' },
];

const ALSO_ON = [
  ['EUROPE', 'Poland: fallen objects were Russian cruise missiles; NATO to meet'],
  ['EUROPE', 'France–Ukraine to build SAMP/T defences jointly'],
  ['EUROPE', 'Ukraine hits Russian oil sites in Rostov, Perm and Tatarstan'],
  ['MIDDLE EAST', 'Bahrain: Iranian strike wounds two at a civilian site'],
  ['MIDDLE EAST', 'Trump warns Iran of new strikes if talks fail'],
  ['AFRICA', 'Kenya & DR Congo restore diplomatic ties'],
  ['AFRICA', 'Libya: eastern forces claim Benghazi port after drone strikes'],
  ['ASIA-PACIFIC', 'Taiwan bans short-selling; stocks swing 1,578 points'],
  ['ASIA-PACIFIC', 'KOSPI falls 3%; China unveils a "three arrows" rescue'],
  ['ASIA-PACIFIC', 'Trump, Putin, Xi meet in Shenzhen; peace declaration'],
  ['SOUTH ASIA', 'Bangladesh: Hasina to be jailed if she returns from India'],
  ['SOUTH ASIA', 'India: Nifty falls 1.75% as the AI rout reaches Mumbai'],
  ['NORTH AMERICA', 'Delta outage delays 1,600+ flights as Thanksgiving begins'],
  ['LATIN AMERICA', 'Brazil votes on Lula fiscal bill; 2027 savings $0.6–1.9bn'],
  ['LATIN AMERICA', 'Colombia: drones hit Cúcuta police command; homes damaged'],
  ['LATIN AMERICA', 'Peru: aftershocks after 6.7 quake; one known death'],
  ['OCEANIA', 'Australia: music broadcaster Molly Meldrum dies at 83'],
  ['OCEANIA', 'Newspoll: Taylor 42, Albanese 41; Labor=One Nation 27%'],
  ['GLOBAL', 'Bitcoin ETFs bleed $1.79bn in a week'],
];

const TIMELINE = [
  ['SEOUL', 'EXPORTS TOP $1T'],
  ['BANTEN', 'FIRE, 24 DEAD'],
  ['ANTALYA', 'COP31 COLLAPSES'],
  ['KYIV', 'DYMER STRIKE'],
  ['BENGHAZI', 'WARSHIP SUNK'],
  ['WASHINGTON', 'HOUSE 258'],
];

const DATA_STRIP = [
  ['258', "DEMOCRATS' HOUSE SEATS"],
  ['−5.06%', 'NIKKEI, FRI CLOSE'],
  ['$1T', 'S. KOREA EXPORTS'],
  ['11', 'KILLED IN DYMER'],
  ['29', 'BAYELSA BOAT TOLL'],
  ['32.5M', 'GTA VI PRE-ORDERS'],
];

const REGIONS = ['EUROPE', 'MIDDLE EAST', 'AFRICA', 'ASIA-PACIFIC', 'SOUTH ASIA', 'NORTH AMERICA', 'LATIN AMERICA', 'OCEANIA', 'GLOBAL'];

// ---------- pictorial lead banners (drawn div-art, no photos) ----------
function bannerCOP31(x, y, w, h) {
  return abs(x, y, w, h, { backgroundColor: TEAL, overflow: 'hidden' },
    // cracked globe
    abs(16, 14, 82, 82, { backgroundColor: '#7dd3fc', borderRadius: '50%', overflow: 'hidden' },
      abs(10, 18, 30, 20, { backgroundColor: '#4ade80', borderRadius: '50%' }),
      abs(44, 48, 26, 18, { backgroundColor: '#4ade80', borderRadius: '50%' }),
      abs(38, 0, 4, 82, { backgroundColor: '#f6f1e5', transform: 'rotate(18deg)' }),
      abs(20, 34, 44, 4, { backgroundColor: '#f6f1e5', transform: 'rotate(-24deg)' }),
    ),
    // red slash across the globe
    abs(6, 52, 104, 7, { backgroundColor: RED, transform: 'rotate(-14deg)' }),
    // NO DEAL stamp
    ...T('lead1-stamp', x + 118, y + 22, 180, ['NO DEAL'], 34, 900, { lh: 36, color: '#ffffff', maxLines: 1 }),
    ...T('lead1-sub', x + 118, y + 60, 180, ['190+ NATIONS · NO PACT'], 10, 700, { lh: 12, color: '#d1fae5', maxLines: 1 }),
    // flag dots
    ...[0, 1, 2, 3, 4].map((i) => abs(x + 118 + i * 20, y + 84, 14, 10, { backgroundColor: ['#b42318', '#1d4ed8', '#ca8a04', '#15803d', '#6d28d9'][i] })),
  );
}
function bannerBenghazi(x, y, w, h) {
  return abs(x, y, w, h, { backgroundColor: NAVY, overflow: 'hidden' },
    abs(258, 12, 30, 30, { backgroundColor: '#fef3c7', borderRadius: '50%' }),
    // sea
    abs(0, 74, w, 38, { backgroundColor: '#155e75' }),
    abs(0, 74, w, 3, { backgroundColor: '#67e8f9' }),
    // ship hull + mast + funnel
    abs(52, 62, 150, 20, { backgroundColor: '#111827', borderRadius: 4 }),
    abs(52, 78, 150, 6, { backgroundColor: '#111827', borderRadius: 3 }),
    abs(120, 34, 4, 30, { backgroundColor: '#9ca3af' }),
    abs(150, 44, 16, 20, { backgroundColor: '#6b7280' }),
    // explosion starburst at the stern
    abs(36, 44, 26, 26, { backgroundColor: '#facc15', transform: 'rotate(45deg)' }),
    abs(40, 48, 18, 18, { backgroundColor: '#f97316', transform: 'rotate(22deg)' }),
    abs(45, 53, 9, 9, { backgroundColor: '#fff7ed', borderRadius: '50%' }),
    // sea drones: dots + dashed track
    abs(210, 88, 70, 0, { borderTop: '2px dashed #a5f3fc' }),
    ...[0, 1, 2].map((i) => abs(216 + i * 24, 84, 8, 8, { backgroundColor: '#e0f2fe', borderRadius: '50%' })),
    // chip
    abs(10, 88, 108, 16, { backgroundColor: RED, borderRadius: 3 },
      ...T('lead2-chip', x + 10, y + 91, 108, ['7 SEA DRONES'], 10, 800, { lh: 12, color: '#ffffff', maxLines: 1, align: 'center' }),
    ),
  );
}
function bannerDymer(x, y, w, h) {
  const windows = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      windows.push(abs(12 + c * 20, 12 + r * 20, 10, 12, { backgroundColor: (r + c) % 3 === 0 ? '#fde68a' : '#44403c' }));
    }
  }
  return abs(x, y, w, h, { backgroundColor: '#57534e', overflow: 'hidden' },
    // standing block
    abs(24, 12, 92, 84, { backgroundColor: '#78716c' }, ...windows),
    // collapsed, tilted block
    abs(150, 44, 90, 52, { backgroundColor: '#44403c', transform: 'rotate(12deg)' }),
    abs(158, 56, 10, 12, { backgroundColor: '#fde68a' }),
    abs(182, 62, 10, 12, { backgroundColor: '#44403c' }),
    abs(206, 68, 10, 12, { backgroundColor: '#fde68a' }),
    // rubble dots
    ...[0, 1, 2, 3, 4].map((i) => abs(150 + i * 18, 96 - (i % 2) * 5, 8, 8, { backgroundColor: '#a8a29e', borderRadius: 2 })),
    // crane
    abs(268, 8, 4, 88, { backgroundColor: '#d6d3d1' }),
    abs(240, 8, 36, 4, { backgroundColor: '#d6d3d1' }),
    abs(238, 12, 2, 26, { backgroundColor: '#d6d3d1' }),
    abs(234, 38, 10, 10, { backgroundColor: '#facc15', borderRadius: '50%' }),
    // rescue-light chip
    abs(10, 88, 128, 16, { backgroundColor: GOLD, borderRadius: 3 },
      ...T('lead3-chip', x + 10, y + 91, 128, ['BOY, 7, ALIVE'], 10, 800, { lh: 12, color: '#ffffff', maxLines: 1, align: 'center' }),
    ),
  );
}

// ---------- small pictogram tiles (40x40, white shapes on region colour) ----------
function iconTile(region, kind, x, y) {
  const bg = REGION_COLOR[region];
  const tile = (kids) => abs(x, y, 40, 40, { backgroundColor: bg, borderRadius: 8, overflow: 'hidden' }, ...kids);
  const white = (sx, sy, w, h, extra = {}) => abs(sx, sy, w, h, { backgroundColor: '#ffffff', ...extra });
  switch (kind) {
    case 'ship': return tile([
      white(6, 24, 28, 8, { borderRadius: 2 }), white(18, 10, 3, 14), white(8, 28, 4, 4, { borderRadius: '50%' }), white(28, 28, 4, 4, { borderRadius: '50%' }),
    ]);
    case 'drone': return tile([
      white(18, 18, 5, 5, { borderRadius: '50%' }),
      white(7, 7, 12, 3, { transform: 'rotate(45deg)' }), white(21, 7, 12, 3, { transform: 'rotate(-45deg)' }),
      white(7, 30, 12, 3, { transform: 'rotate(-45deg)' }), white(21, 30, 12, 3, { transform: 'rotate(45deg)' }),
    ]);
    case 'cross': return tile([white(16, 7, 8, 26), white(7, 16, 26, 8)]);
    case 'tanker': return tile([
      white(8, 12, 24, 20, { borderRadius: 6 }), white(8, 20, 24, 3, { backgroundColor: bg }), white(16, 6, 6, 6),
    ]);
    case 'building': return tile([
      white(8, 8, 24, 26), white(12, 14, 3, 14, { backgroundColor: bg }), white(18, 14, 3, 14, { backgroundColor: bg }), white(25, 14, 3, 14, { backgroundColor: bg }),
    ]);
    case 'boat': return tile([
      white(6, 14, 28, 9, { borderRadius: 2 }), white(18, 6, 3, 8), white(8, 28, 8, 3, { borderRadius: 2 }), white(24, 28, 8, 3, { borderRadius: 2 }),
    ]);
    case 'chip': return tile([
      white(10, 10, 20, 20, { borderRadius: 3 }), white(16, 16, 8, 8, { backgroundColor: bg }),
      white(4, 16, 6, 3), white(30, 16, 6, 3), white(16, 4, 3, 6), white(16, 30, 3, 6),
    ]);
    case 'flame': return tile([
      white(13, 16, 14, 16, { borderRadius: '50%' }), white(16, 8, 10, 10, { transform: 'rotate(45deg)' }),
    ]);
    case 'ballot': return tile([
      white(8, 16, 24, 18, { borderRadius: 2 }), white(13, 10, 12, 3, { transform: 'rotate(-45deg)' }), white(22, 8, 3, 12, { transform: 'rotate(45deg)' }),
    ]);
    case 'coin': return tile([
      abs(8, 8, 24, 24, { backgroundColor: '#ffffff', borderRadius: '50%' },
        ...T('icon-coin', x + 8, y + 13, 24, ['1¢'], 13, 800, { lh: 15, color: bg, maxLines: 1, align: 'center' })),
    ]);
    default: return tile([]);
  }
}

// ---------- page sections ----------
function masthead() {
  return [
    rule(16, 6, 992, 4, INK),
    ...T('mast-title', 16, 14, 620, ['THE WORLD IN ONE PAGE'], 40, 900, { lh: 44, maxLines: 1 }),
    ...T('mast-date', 640, 16, 368, ['MONDAY 23 NOVEMBER 2026'], 17, 800, { lh: 20, maxLines: 1, align: 'right' }),
    ...T('mast-sub', 640, 38, 368, ['32 STORIES · 9 REGIONS · ONE DAY'], 11, 700, { lh: 14, maxLines: 1, align: 'right', color: MUTED }),
    rule(16, 62, 992, 1, INK),
  ];
}

function timeline() {
  const kids = [
    ...T('tl-label', 16, 74, 92, ['FOLLOW', 'THE SUN'], 10, 800, { lh: 12, maxLines: 2 }),
    abs(120, 86, 880, 2, { backgroundColor: '#c9bfa8' }),
  ];
  TIMELINE.forEach(([place, what], i) => {
    const cx = 190 + i * 135;
    kids.push(abs(cx - 5, 82, 10, 10, { backgroundColor: RED, borderRadius: '50%', border: '2px solid #ffffff' }));
    kids.push(...T(`tl-${i}`, cx - 65, 96, 130, [`${place} · ${what}`], 8.5, 700, { lh: 11, maxLines: 1, align: 'center' }));
  });
  return kids;
}

function dataStrip() {
  const kids = [abs(16, 108, 992, 34, { backgroundColor: INK })];
  DATA_STRIP.forEach(([num, label], i) => {
    const cx = 16 + i * (992 / 6);
    kids.push(...T(`ds-num-${i}`, cx, 112, 992 / 6, [num], 19, 800, { lh: 20, color: '#e8b64c', maxLines: 1, align: 'center' }));
    kids.push(...T(`ds-lab-${i}`, cx, 133, 992 / 6, [label], 8, 700, { lh: 10, color: '#f6f1e5', maxLines: 1, align: 'center' }));
    if (i > 0) kids.push(abs(cx, 113, 1, 24, { backgroundColor: '#3f3a2e' }));
  });
  return kids;
}

function leads() {
  const kids = [];
  LEADS.forEach((lead, i) => {
    const x = 16 + i * 328;
    const y = 146;
    kids.push(abs(x, y, 320, 252, { backgroundColor: PANEL, border: `1px solid ${RULE}` }));
    kids.push(abs(x, y, 320, 4, { backgroundColor: lead.color }));
    const banner = lead.kicker.startsWith('LEAD 1') ? bannerCOP31(x + 4, y + 10, 312, 112)
      : lead.kicker.startsWith('LEAD 2') ? bannerBenghazi(x + 4, y + 10, 312, 112)
        : bannerDymer(x + 4, y + 10, 312, 112);
    kids.push(banner);
    kids.push(...T(`lead${i}-kicker`, x + 10, y + 128, 300, [lead.kicker], 10, 800, { lh: 12, color: lead.color, maxLines: 1 }));
    kids.push(...T(`lead${i}-head`, x + 10, y + 144, 300, lead.head, 19, 800, { lh: 22, maxLines: 2 }));
    kids.push(...T(`lead${i}-deck`, x + 10, y + 192, 300, [lead.deck], 10.5, 400, { lh: 12, maxLines: 4 }));
    kids.push(...T(`lead${i}-foot`, x + 10, y + 242, 300, [lead.foot], 8, 700, { lh: 10, color: MUTED, maxLines: 1 }));
  });
  return kids;
}

// ---------- pictured stories ----------
function pictured() {
  const kids = [
    ...T('pic-head', 16, 402, 600, ['PICTURED — TEN STORIES THAT SHOW THE DAY'], 12, 800, { lh: 14, maxLines: 1 }),
    ...T('pic-note', 640, 404, 368, ['EACH PICTURE DRAWN, NOT PHOTOGRAPHED'], 9, 700, { lh: 11, maxLines: 1, align: 'right', color: MUTED }),
    rule(16, 418, 992, 1, INK),
  ];
  PICTURED.forEach((s, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = 16 + col * 200;
    const y = 422 + row * 78;
    kids.push(iconTile(s.region, s.icon, x, y));
    kids.push(...T(`pic${i}-head`, x + 48, y + 1, 144, [s.head], 11, 800, { lh: 13, maxLines: 2 }));
    kids.push(...T(`pic${i}-deck`, x, y + 46, 192,
      [{ text: `${s.region} · `, weight: 700, color: REGION_COLOR[s.region] }, { text: s.deck, weight: 400, color: INK }],
      9.5, 400, { lh: 11.5, maxLines: 2 }));
  });
  return kids;
}

// ---------- schematic world map ----------
const CONTINENTS = [
  [[-168, 66], [-150, 70], [-140, 70], [-125, 72], [-110, 73], [-95, 80], [-85, 70], [-80, 73], [-75, 62], [-65, 60], [-55, 52], [-60, 45], [-70, 42], [-75, 35], [-80, 32], [-85, 30], [-90, 29], [-97, 26], [-105, 22], [-110, 24], [-115, 30], [-120, 34], [-125, 40], [-130, 48], [-140, 60], [-155, 58], [-165, 60]],
  [[-80, 10], [-75, 5], [-70, 0], [-60, -5], [-50, -5], [-35, -8], [-40, -20], [-48, -28], [-55, -35], [-65, -40], [-70, -50], [-73, -40], [-72, -20], [-75, -15], [-80, -5]],
  [[-10, 36], [-5, 44], [0, 50], [5, 55], [8, 57], [12, 55], [18, 56], [20, 60], [25, 65], [30, 70], [35, 68], [40, 60], [35, 55], [30, 50], [28, 45], [25, 40], [20, 38], [15, 38], [10, 37], [5, 36], [0, 36], [-5, 36]],
  [[-17, 15], [-10, 30], [0, 35], [10, 37], [20, 32], [30, 31], [35, 28], [40, 15], [45, 11], [50, 10], [48, 0], [40, -10], [35, -20], [30, -30], [20, -35], [15, -30], [12, -18], [10, -5], [8, 4], [0, 5], [-8, 5], [-13, 8]],
  [[40, 70], [60, 70], [80, 73], [100, 75], [130, 72], [160, 70], [180, 66], [170, 60], [160, 55], [150, 45], [140, 40], [130, 35], [127, 33], [122, 30], [120, 25], [115, 20], [108, 10], [105, 5], [100, 8], [95, 15], [90, 22], [85, 20], [80, 15], [75, 10], [70, 20], [65, 25], [60, 25], [55, 28], [50, 30], [45, 35], [42, 40], [40, 45], [38, 55], [40, 65]],
  [[113, -22], [120, -15], [130, -12], [140, -17], [150, -22], [153, -28], [150, -37], [140, -38], [130, -32], [120, -34], [114, -30]],
];
const MAP_X = 24;
const MAP_Y = 606;
const MAP_W = 544;
const MAP_H = 170;
const lonToX = (lon) => MAP_X + ((lon + 170) / 360) * MAP_W;
const latToY = (lat) => MAP_Y + ((75 - lat) / 130) * MAP_H;
const HOTSPOTS = [
  { name: 'DYMER', lon: 30.5, lat: 50.5, lx: 336, ly: 618 },
  { name: 'BALTIC SEA', lon: 20, lat: 58, lx: 222, ly: 614 },
  { name: 'ANTALYA', lon: 30.7, lat: 36.9, lx: 335, ly: 648 },
  { name: 'BENGHAZI', lon: 20.1, lat: 32.1, lx: 317, ly: 664 },
  { name: 'SEOUL', lon: 127, lat: 37.5, lx: 479, ly: 647 },
  { name: 'KHARTOUM', lon: 32.5, lat: 15.5, lx: 336, ly: 680 },
  { name: 'BAYELSA', lon: 6.3, lat: 4.9, lx: 214, ly: 700 },
  { name: 'BANTEN', lon: 106, lat: -6.2, lx: 447, ly: 704 },
];

function mapPanel() {
  const kids = [
    abs(16, 580, 560, 210, { backgroundColor: PANEL, border: `1px solid ${RULE}` }),
    ...T('map-head', 24, 588, 544, ['WHERE IT HAPPENED — 8 HOTSPOTS, MONDAY 23 NOV'], 11, 800, { lh: 13, maxLines: 1 }),
    abs(MAP_X, MAP_Y, MAP_W, MAP_H, { backgroundColor: '#dce9f2' }),
  ];
  const polys = CONTINENTS.map((c) =>
    e('polygon', {
      key: c[0].join(','),
      points: c.map(([lo, la]) => `${(((lo + 170) / 360) * MAP_W).toFixed(1)},${(((75 - la) / 130) * MAP_H).toFixed(1)}`).join(' '),
      fill: '#d9cfae', stroke: '#8a7d5c', strokeWidth: 1,
    }));
  kids.push(e('svg', {
    key: 'map-svg', width: MAP_W, height: MAP_H, viewBox: `0 0 ${MAP_W} ${MAP_H}`,
    style: { position: 'absolute', left: MAP_X, top: MAP_Y },
  }, ...polys));
  for (const h of HOTSPOTS) {
    const dx = lonToX(h.lon);
    const dy = latToY(h.lat);
    const labelW = Math.ceil(textWidth(h.name, 8.5, 800)) + 10;
    kids.push(abs(dx - 4, dy - 4, 8, 8, { backgroundColor: RED, borderRadius: '50%', border: '2px solid #ffffff' }));
    kids.push(abs(h.lx, h.ly, labelW, 13, { backgroundColor: 'rgba(255,253,246,0.92)', border: '1px solid #b9ac8d', borderRadius: 3 }));
    kids.push(...T(`map-${h.name}`, h.lx + 5, h.ly + 1, labelW - 10, [h.name], 8.5, 800, { lh: 11, maxLines: 1 }));
  }
  return kids;
}

// ---------- charts ----------
function charts() {
  const kids = [];
  // Chart 1 — the rout (vertical bars)
  kids.push(abs(584, 580, 424, 108, { backgroundColor: PANEL, border: `1px solid ${RULE}` }));
  kids.push(...T('ch1-head', 596, 586, 400, ['THE ROUT — MARKETS, FRI–MON, % CHANGE'], 10, 800, { lh: 12, maxLines: 1 }));
  const BARS = [
    ['TAIEX', '-6.20%', -6.20], ['NASDAQ', '-5.28%', -5.28], ['NIKKEI', '-5.06%', -5.06],
    ['S&P 500', '-3.70%', -3.70], ['KOSPI', '-3.31%', -3.31], ['HANG SENG', '-1.90%', -1.90], ['GOLD', '+3.14%', 3.14],
  ];
  const BASE = 640;
  BARS.forEach(([name, val, v], i) => {
    const bx = 596 + i * 56;
    const h = Math.round((Math.abs(v) / 6.2) * 24);
    const color = v < 0 ? RED : '#ca8a04';
    const top = v < 0 ? BASE : BASE - h;
    kids.push(abs(bx, top, 44, h, { backgroundColor: color }));
    if (v < 0) {
      kids.push(...T(`ch1-v${i}`, bx, BASE + h + 2, 44, [val], 8, 800, { lh: 10, maxLines: 1, align: 'center' }));
      kids.push(...T(`ch1-n${i}`, bx - 6, BASE + h + 13, 56, [name], 7.5, 700, { lh: 10, maxLines: 1, align: 'center', color: MUTED }));
    } else {
      kids.push(...T(`ch1-v${i}`, bx, BASE - h - 11, 44, [val], 8, 800, { lh: 10, maxLines: 1, align: 'center' }));
      kids.push(...T(`ch1-n${i}`, bx - 6, BASE + 2, 56, [name], 7.5, 700, { lh: 10, maxLines: 1, align: 'center', color: MUTED }));
    }
  });
  kids.push(abs(596, BASE, 400, 1, { backgroundColor: INK }));
  // Chart 2 — Taiex intraday line
  kids.push(abs(584, 692, 424, 98, { backgroundColor: PANEL, border: `1px solid ${RULE}` }));
  kids.push(...T('ch2-head', 596, 698, 400, ['TAIEX, MONDAY — 1,578-POINT SWING'], 10, 800, { lh: 12, maxLines: 1 }));
  const pts = [[32, 66], [162, 85], [292, 33], [392, 67]];
  kids.push(e('svg', {
    key: 'ch2-svg', width: 424, height: 98, viewBox: '0 0 424 98',
    style: { position: 'absolute', left: 584, top: 692 },
  },
  e('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: RED, strokeWidth: 3 }),
  ...pts.map(([px, py], i) => e('circle', { key: i, cx: px, cy: py, r: 4, fill: RED, stroke: '#ffffff', strokeWidth: 1.5 })),
  ));
  kids.push(...T('ch2-high', 836, 712, 80, ['HIGH 37,021'], 8, 800, { lh: 10, maxLines: 1, align: 'center' }));
  kids.push(...T('ch2-fri', 596, 742, 80, ['FRI 36,033'], 8, 700, { lh: 10, maxLines: 1, color: MUTED }));
  kids.push(...T('ch2-low', 706, 764, 80, ['LOW 35,442'], 8, 800, { lh: 10, maxLines: 1, align: 'center' }));
  kids.push(...T('ch2-close', 936, 766, 64, ['CLOSE ~36,000'], 8, 700, { lh: 10, maxLines: 1, color: MUTED }));
  return kids;
}

// ---------- also on ----------
function alsoOn() {
  const kids = [
    ...T('ao-head', 16, 798, 600, ['ALSO ON — 19 MORE STORIES FROM THE DAY'], 12, 800, { lh: 14, maxLines: 1 }),
    rule(16, 816, 992, 1, INK),
  ];
  ALSO_ON.forEach(([region, head], i) => {
    const col = Math.floor(i / 5);
    const row = i % 5;
    const x = 16 + col * 248;
    const y = 820 + row * 27;
    kids.push(...T(`ao-${i}`, x, y, 232,
      [{ text: `${region} — `, weight: 700, color: REGION_COLOR[region] }, { text: head, weight: 400, color: INK }],
      9.5, 400, { lh: 11.5, maxLines: 2 }));
  });
  return kids;
}

// ---------- footer ----------
function footer() {
  return [
    rule(16, 960, 992, 1, INK),
    ...T('ft-1', 16, 966, 992, ['DATE CHECK — Every story above happened, or was first reported, on Monday 23 November 2026.'], 9, 700, { lh: 12, maxLines: 1 }),
    ...T('ft-2', 16, 978, 992, ['Market figures are Fri 20 Nov closes where markets were shut on Monday (Nikkei); Monday closes where they traded.'], 9, 400, { lh: 12, maxLines: 1 }),
    ...T('ft-3', 16, 990, 992, ['HOW SURE — • Reported by Reuters / AP / BBC / NYT / WSJ on 23 Nov  • Market data from the wires  • Follow-ups to earlier events are labelled as reports.'], 9, 400, { lh: 12, maxLines: 1 }),
    ...T('ft-4', 16, 1002, 992, ['Sources: Just Security Early Edition · Reuters · AP · BBC · NYT · WSJ · Rio Times · Afripoli · UBStandard · AAP · ABC Australia.'], 9, 400, { lh: 12, maxLines: 1 }),
  ];
}

// ---------- render ----------
const tree = D({ width: W, height: H, backgroundColor: PAPER, position: 'relative', fontFamily: 'Inter' },
  ...masthead(), ...timeline(), ...dataStrip(), ...leads(), ...pictured(), ...mapPanel(), ...charts(), ...alsoOn(), ...footer());

const svg = await satori(tree, { width: W, height: H, fonts: satoriFonts });
const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
fs.writeFileSync(path.join(__dirname, 'entry.png'), png);

const { createHash } = await import('node:crypto');
const sha = createHash('sha256').update(png).digest('hex');
const manifest = {
  stories: LEADS.length + PICTURED.length + ALSO_ON.length,
  leads: LEADS.length,
  pictured: PICTURED.length,
  alsoOn: ALSO_ON.length,
  regions: REGIONS,
  width: W,
  height: H,
  bytes: png.length,
  sha256: sha,
  blocks,
};
fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`rendered entry.png: ${png.length} bytes, sha256 ${sha}`);
console.log(`stories=${manifest.stories} leads=${manifest.leads} pictured=${manifest.pictured} alsoOn=${manifest.alsoOn} regions=${REGIONS.length} blocks=${blocks.length}`);
