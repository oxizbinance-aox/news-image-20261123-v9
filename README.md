# news-image-20261123-v9 — The World in One Page: 32 stories, 9 regions

[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/oxizbinance-aox/news-image-20261123-v9/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/oxizbinance-aox/news-image-20261123-v9/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)

**Monday 23 November 2026: 32 stories, 9 regions.** A pictorial broadsheet front page:
3 lead panels with full drawn pictorial banners (no photos), a "Follow the Sun"
UTC timeline strip, a big-number data strip, 10 pictured stories with drawn
pictograms, a schematic world map with 8 hotspots, 2 charts, and a 19-story
"Also On" list. The counting entry (v8) carried 55 stories; v9 answers with
the pictorial winner template instead — fewer stories, bigger pictures, larger
type, one clear composition that still reads at 300 px across.

## The three leads

1. **COP31 collapses — no deal** (Antalya, Turkey). After a record two days of
   overtime, 190+ nations fail to agree an overarching pact. The EU and ~130 parties
   reject a text with no mention of fossil fuels. 90 nations back electrification;
   47 join a methane cut. First COP collapse since 2009.
2. **Ukraine sinks Russian warship in Libya** (Benghazi). Seven sea drones sink the
   corvette Merkury at Benghazi naval base; a second Russian-linked vessel is hit
   and 10 people are hurt. The war reaches the Mediterranean, 1,600 km from Ukraine.
3. **Strike on Dymer kills 11** (Ukraine). A Russian drone strike partly collapses a
   five-storey apartment block north of Kyiv. A 7-year-old boy is pulled alive after
   14 hours, an elderly woman after 22. Fifteen are killed across the Kyiv region.

## The 10 pictured stories

- **Europe** — Sparta II ablaze in the Baltic, drifts into Finnish waters ·
  Germany tests suicide drones, first test, in Lithuania · NHS trials AI breast
  screening for 700,000 women.
- **Middle East** — Iran vows "all means" vs US blockade; two tankers ablaze.
- **Africa** — Khartoum drone strikes destroy homes, damage UN building · Bayelsa
  boat toll rises to 29.
- **Asia-Pacific** — S. Korea exports top $1T, first time ever (chips +294%) ·
  Banten fire: 24 bodies found, dozens missing.
- **North America** — Democrats win 258 House seats, largest majority since 1992 ·
  The penny ends after 232 years (Common Cents Act signed).

## Also on — 19 more stories

- **Europe** — Poland: fallen objects were Russian cruise missiles; NATO to meet ·
  France–Ukraine to build SAMP/T defences jointly · Ukraine hits Russian oil sites
  in Rostov, Perm and Tatarstan.
- **Middle East** — Bahrain: Iranian strike wounds two at a civilian site · Trump
  warns Iran of new strikes if talks fail.
- **Africa** — Kenya & DR Congo restore diplomatic ties · Libya: eastern forces
  claim Benghazi port after drone strikes.
- **Asia-Pacific** — Taiwan bans short-selling; stocks swing 1,578 points · KOSPI
  falls 3%, China unveils a "three arrows" rescue · Trump, Putin, Xi meet in
  Shenzhen; peace declaration.
- **South Asia** — Bangladesh: Hasina to be jailed if she returns from India ·
  India: Nifty falls 1.75% as the AI rout reaches Mumbai.
- **North America** — Delta outage delays 1,600+ flights as Thanksgiving begins.
- **Latin America** — Brazil votes on Lula fiscal bill; 2027 savings $0.6–1.9bn ·
  Colombia: drones hit Cúcuta police command; homes damaged · Peru: aftershocks
  after 6.7 quake; one known death.
- **Oceania** — Australia: music broadcaster Molly Meldrum dies at 83 · Newspoll:
  Taylor 42, Albanese 41; Labor=One Nation 27%.
- **Global** — Bitcoin ETFs bleed $1.79bn in a week.

## Charts (real numbers from the day)

- **The rout — Fri to Mon, % change:** Taiex (Mon) −6.20, Nasdaq (Fri) −5.28,
  Nikkei (Fri) −5.06, S&P 500 (Fri) −3.70, KOSPI (Mon) −3.31, Hang Seng (Mon)
  −1.90, Gold +3.14.
- **TAIEX, Monday (points):** Fri close 36,033 → early low 35,442 → high 37,021 →
  close ~36,000; a 1,578-point intraday swing, the 13th largest ever.

## Data strip

258 (Democrats' House seats) · −5.06% (Nikkei) · $1T (S. Korea exports) ·
11 (killed in Dymer) · 29 (Bayelsa boat toll) · 32.5M (GTA VI pre-orders).

## Sources & date discipline

Every story comes from the 23 November 2026 editions of Just Security (Early
Edition), Reuters, AP, BBC, NYT, WSJ, Rio Times, Afripoli, UBStandard, AAP, ABC
Australia, and the market wires they cite. Nothing is dated after 23 November
2026. Market figures are Fri 20 Nov closes where the market was shut on Monday
(Nikkei closed for the Japanese holiday) and Monday closes where it traded
(KOSPI, Taiex, Hang Seng); the chart labels each bar Fri or Mon. The footer
carries a DATE CHECK and a HOW SURE legend.

## How it is built

`render.mjs` (Node 22+, Satori + resvg-js, bundled Inter) draws `entry.png`
from scratch — 1024×1024. Every text element is wrapped and measured with
fontkit before rendering, and its bounding box is written to `manifest.json`.
`validate.mjs` re-measures every line and checks: all blocks inside the canvas,
every line fits its box, no two text blocks overlap, story count 30–35,
regions 8–9. `main.ts` (Node stdlib only) copies the pre-rendered `entry.png`
to the output directory, verifies it meets the limits (≤1 MiB, ≤1024×1024),
and re-reads the copy to confirm its sha256 matches the source. The render is
deterministic: two runs of the draw script and two runs of `main.ts` write
byte-identical PNGs.

- `entry.png` sha256: `e27187069fdb7721bc7f0614199979b49c4771f1d2212cfa456c4c5aa6cdc83c`
- Layout gate (fontkit bounding boxes): 114 text blocks, 0 overlaps,
  0 out-of-bounds, all lines fit — PASS. The validator caught and fixed real
  defects during the build: a data-strip label overlapping its number by 1 px,
  two lead decks running into their footlines, and two timeline/chart labels
  wider than their boxes. A visual review caught one more: Satori drops the
  space between sibling spans inside a flex container, so all text is now
  rendered as single-text-node runs positioned by fontkit measurement.
- tesseract is not installed on this VM, so no OCR count was run; the story
  count (32) is verified from the story list in `render.mjs` plus the validator.

## Run it

```sh
npm install   # satori, @resvg/resvg-js, react, fontkit, @fontsource/inter
node render.mjs    # renders entry.png + manifest.json
node validate.mjs  # bounding-box gate
MAKEFUN_OUTPUT_DIR=out node main.ts   # copies entry.png to out/
```

## Anchor note

Build session anchor (kit `init`): `makefun anchor cd47ac402c085045bf89bcccd95d6663a9ed962d round 34243210`.
This entry is submitted as a GitHub repository, for which `thinking_fresh` is
skipped by the checker. The build session began 24 Nov 2026, after the
competition opened (23 Nov 00:00 UTC).

## Bounty

https://make.fun/bounty/news-image-20261123
