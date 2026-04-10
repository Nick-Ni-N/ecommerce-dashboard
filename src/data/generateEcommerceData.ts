// ─── Types ────────────────────────────────────────────────────────────────────

export type ChannelName = 'Organic' | 'Paid Ads' | 'LINE' | 'Referral';

/** One row per day × channel */
export interface EcommerceChannelRow {
  date: string;
  channel: ChannelName;
  uu: number;
  orders: number;
  aov: number;
  gmv: number;
  gross_margin: number; // ratio 0.32–0.44
  net_profit: number;
}

/** One row per day (all channels summed) */
export interface EcommerceDailyRow {
  date: string;
  uu: number;
  orders: number;
  aov: number;
  gmv: number;
  gross_margin: number; // ratio 0.35–0.42
  net_profit: number;
  newUsers: number;       // uu × newUserRatio (clamped 0.15–0.40)
  returningUsers: number; // uu - newUsers
  newGMV: number;         // GMV attributed to new customers
  returningGMV: number;   // GMV attributed to returning customers
}

export interface GenerateResult {
  /** totalDays × 4 rows, sorted by date then CH order */
  channelData: EcommerceChannelRow[];
  /** totalDays rows, one per date */
  totalData: EcommerceDailyRow[];
}

// ─── PRNG ─────────────────────────────────────────────────────────────────────
// Park-Miller LCG — JS-float safe (max product 3.6e13 < 2^53)

function mkRng(seed: number) {
  let s = ((seed % 2_147_483_646) + 2_147_483_646) % 2_147_483_646 || 1;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646; // uniform [0, 1)
  };
}

// ─── Trend Curve ──────────────────────────────────────────────────────────────
// Control points anchored to 2025-01-01 (day 0).
//
// Design principle:
//   • Clear quarterly growth: Q1'25≈1.00 → Q3'25≈1.09 → Q4'25≈1.23 → Q1'26≈1.27
//   • 雙十一 / 雙十二 / year-end create visible spikes above the rising baseline
//   • Post-NY and CNY dips are MILD — 2026 off-peak ≫ 2025 off-peak
//   • Monthly-granularity chart shows unambiguous upward trend
//
// Key day anchors (days from 2025-01-01):
//   d89=2025-03-31  d180=2025-06-30  d272=2025-09-30
//   d303=2025-10-31 d314=2025-11-11  d333=2025-11-30
//   d345=2025-12-12 d364=2025-12-31  d365=2026-01-01
//   d375=2026-01-11 d395=2026-01-31  d411=2026-02-16
//   d415=2026-02-20 d423=2026-02-28  d430=2026-03-07
//   d442=2026-03-19

const EPOCH_MS = new Date('2025-01-01').getTime();
const MS_DAY = 86_400_000;

const KNOTS: [number, number][] = [
  [0,   1.00], // 2025-01-01  Q1 baseline
  [89,  1.01], // 2025-03-31
  [180, 1.06], // 2025-06-30  H1 growth
  [272, 1.11], // 2025-09-30  Q3 end
  [303, 1.15], // 2025-10-31  pre-holiday ramp
  [314, 1.30], // 2025-11-11  雙十一 spike
  [315, 1.22], // 2025-11-12  day-after settle
  [333, 1.22], // 2025-11-30
  [345, 1.28], // 2025-12-12  雙十二 spike
  [346, 1.23], // 2025-12-13
  [360, 1.29], // 2025-12-26  year-end push
  [364, 1.26], // 2025-12-31
  // 2026: floor stays above 2025 equivalents even at seasonal troughs
  [365, 1.25], // 2026-01-01  (≈ Nov'25 non-spike base — clearly above Oct'25 1.15)
  [375, 1.20], // 2026-01-11  mild post-NY settling (still > Oct'25 at 1.15)
  [395, 1.26], // 2026-01-31  年貨節 pre-CNY build
  [411, 1.35], // 2026-02-16  CNY eve peak (new high)
  [415, 1.18], // 2026-02-20  CNY holiday dip (still > Jul'25 at 1.06)
  [423, 1.24], // 2026-02-28  post-CNY bounce
  [430, 1.28], // 2026-03-07  recovery
  [442, 1.36], // 2026-03-19  highest sustained level
];

function trendAt(dateMs: number): number {
  const day = Math.round((dateMs - EPOCH_MS) / MS_DAY);
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const [d0, v0] = KNOTS[i];
    const [d1, v1] = KNOTS[i + 1];
    if (day >= d0 && day <= d1) {
      return v0 + (v1 - v0) * ((day - d0) / (d1 - d0));
    }
  }
  return KNOTS[KNOTS.length - 1][1];
}

// ─── DOW Seasonality ──────────────────────────────────────────────────────────
// Mon=0 … Sun=6

const DOW_UU  = [0.86, 0.83, 0.87, 0.92, 1.05, 1.32, 1.20];
const DOW_CVR = [0.025, 0.024, 0.026, 0.028, 0.032, 0.036, 0.032];
const DOW_AOV = [1.000, 0.990, 1.000, 1.010, 1.030, 1.055, 1.020];

// ─── Channel Configs ──────────────────────────────────────────────────────────

interface ChannelCfg {
  name: ChannelName;
  /** Baseline share of total GMV (pre-normalisation) */
  baseGmvShare: number;
  /** Channel AOV relative to total AOV */
  aovMult: number;
  /** Channel CVR relative to total CVR */
  cvrMult: number;
  /** Adjustment to total gross_margin for this channel */
  marginAdj: number;
  /** Share-noise volatility multiplier (higher = more day-to-day variation) */
  shareVol: number;
}

// Channel characteristics:
//   Organic   — stable, high-CVR loyal audience, slightly above-average AOV & margin
//   Paid Ads  — volatile, below-average AOV (promo/bargain traffic), lower margin (ad cost)
//   LINE      — moderate, burst on push-notification days
//   Referral  — smallest, highest AOV (quality referral), lagged post-event spike
const CH: ChannelCfg[] = [
  { name: 'Organic',  baseGmvShare: 0.40, aovMult: 1.05, cvrMult: 1.12, marginAdj: +0.020, shareVol: 0.40 },
  { name: 'Paid Ads', baseGmvShare: 0.30, aovMult: 0.93, cvrMult: 0.88, marginAdj: -0.030, shareVol: 1.60 },
  { name: 'LINE',     baseGmvShare: 0.15, aovMult: 1.00, cvrMult: 1.05, marginAdj: +0.005, shareVol: 0.90 },
  { name: 'Referral', baseGmvShare: 0.15, aovMult: 1.10, cvrMult: 0.92, marginAdj: +0.015, shareVol: 1.10 },
];

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateEcommerceData(
  startDate: string,
  endDate: string,
  seed = 42,
): GenerateResult {
  const rng   = mkRng(seed);
  const rand  = () => rng();           // [0, 1)
  const randn = () => rng() * 2 - 1;  // [-1, 1)

  // Separate RNG for new/returning split — keeps main rng sequence identical
  const rng2    = mkRng(seed + 137);
  const rand2   = () => rng2();
  const randn2  = () => rng2() * 2 - 1;

  const startMs   = new Date(startDate).getTime();
  const endMs     = new Date(endDate).getTime();
  const totalDays = Math.round((endMs - startMs) / MS_DAY) + 1;
  if (totalDays <= 0) return { channelData: [], totalData: [] };

  // ── Per-week amplitude modifier (0.92–1.08) ──────────────────────────────────
  const nWeeks = Math.ceil(totalDays / 7) + 2;
  const weekAmp = Array.from({ length: nWeeks }, () => 0.92 + rand() * 0.16);

  // ── Total-metric noise (5 independent channels × totalDays) ──────────────────
  // ch 0=UU  1=CVR  2=AOV  3=grossMargin  4=opLeverage
  const tn: number[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: totalDays }, randn),
  );

  // ── Activity spikes: every 30–45 days, GMV ×1.5–2.2 ─────────────────────────
  const spikes = new Map<number, number>(); // day → multiplier
  let nextSpike = 28 + Math.floor(rand() * 18);
  while (nextSpike < totalDays) {
    spikes.set(nextSpike, 1.5 + rand() * 0.7);
    if (rand() > 0.45)
      spikes.set(nextSpike + 1, 1.25 + rand() * 0.45); // carry-over day
    nextSpike += 30 + Math.floor(rand() * 16);
  }

  // ── LINE push-notification days: every 12–18 days ────────────────────────────
  const lineDays = new Set<number>();
  let nextLine = 8 + Math.floor(rand() * 10);
  while (nextLine < totalDays) {
    lineDays.add(nextLine);
    nextLine += 12 + Math.floor(rand() * 7);
  }

  // ── Channel noise arrays (4 channels × totalDays each) ───────────────────────
  // cnShare  — GMV share drift noise
  // cnAov    — per-channel AOV noise
  // cnMargin — per-channel gross margin noise
  // cnOp     — per-channel operating-leverage noise
  const cnShare:  number[][] = Array.from({ length: CH.length }, () => Array.from({ length: totalDays }, randn));
  const cnAov:    number[][] = Array.from({ length: CH.length }, () => Array.from({ length: totalDays }, randn));
  const cnMargin: number[][] = Array.from({ length: CH.length }, () => Array.from({ length: totalDays }, randn));
  const cnOp:     number[][] = Array.from({ length: CH.length }, () => Array.from({ length: totalDays }, randn));

  // NVR noise (via rng2 — independent of main sequence)
  const nvrRatio:  number[] = Array.from({ length: totalDays }, randn2); // new-user ratio noise
  const nvrNewAov: number[] = Array.from({ length: totalDays }, rand2);  // new-customer AOV mult noise
  const nvrRetAov: number[] = Array.from({ length: totalDays }, rand2);  // returning AOV mult noise

  const channelData: EcommerceChannelRow[] = [];
  const totalData:   EcommerceDailyRow[]   = [];

  for (let i = 0; i < totalDays; i++) {
    const ms  = startMs + i * MS_DAY;
    const d   = new Date(ms);
    const dow = d.getDay();
    const di  = dow === 0 ? 6 : dow - 1; // Mon=0…Sun=6
    const wk  = Math.floor(i / 7);

    const tf      = trendAt(ms);
    const wa      = weekAmp[wk];
    const spk     = spikes.get(i) ?? 1.0;
    const isSp    = spk > 1.0;
    const isPostSp = spikes.has(i - 1);   // Referral lagged effect
    const isLine   = lineDays.has(i);     // LINE push day

    // ── Step 1: Generate total metrics ──────────────────────────────────────────

    // UU: spike lifts UU by ~60% of GMV multiplier (marginal / less-loyal visitors)
    const uuSpk   = isSp ? 1 + (spk - 1) * 0.6 : 1.0;
    const tUu = Math.max(800, Math.round(
      14_500 * DOW_UU[di] * wa * tf * (1 + tn[0][i] * 0.09) * uuSpk,
    ));

    // CVR: DOW pattern + noise + spike uplift
    const tCvr = Math.min(0.06, Math.max(0.018,
      DOW_CVR[di] * (1 + tn[1][i] * 0.18) * (isSp ? 1.12 : 1.0),
    ));
    const tOrders = Math.max(1, Math.round(tUu * tCvr));

    // AOV: long-term drift (+8% over full period) + DOW + spike discount/premium
    const aovDrift = 1_460 * (1 + (i / Math.max(1, totalDays - 1)) * 0.08);
    const aovSpk   = isSp
      ? (rand() > 0.5 ? 0.84 + rand() * 0.10 : 1.08 + rand() * 0.12) // discount OR premium
      : 1.0;
    const tAov = Math.max(900, Math.round(
      aovDrift * DOW_AOV[di] * aovSpk * (1 + tn[2][i] * 0.055),
    ));

    const tGmv = tOrders * tAov;

    // Gross margin: slow sinusoidal seasonal drift + spike discount
    const gmBase = 0.384 + tn[3][i] * 0.024 + Math.sin(i / 50) * 0.007;
    const tGm = Math.min(0.42, Math.max(0.35,
      gmBase - (isSp ? 0.03 + rand() * 0.04 : 0),
    ));

    // Net profit
    const tOpLev = Math.min(0.85, Math.max(0.55, 0.68 + tn[4][i] * 0.10));
    const tNetP  = Math.round(tGmv * tGm * tOpLev);

    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;

    // ── New vs Returning split ────────────────────────────────────────────────
    // Base ~20% new; promo days spike to 34%; wide noise (±7pp); clamp [12%, 48%]
    const newUserRatio  = Math.min(0.48, Math.max(0.12, 0.20 + (isSp ? 0.14 : 0) + nvrRatio[i] * 0.07));
    const tNewUsers     = Math.round(tUu * newUserRatio);
    const tRetUsers     = tUu - tNewUsers;
    // Pronounced AOV gap: new 0.78–0.95×, returning 1.25–1.55× → ~9–10pp GMV vs UU gap
    const rawNewGMV     = tNewUsers  * tAov * (0.78 + nvrNewAov[i] * 0.17);
    const rawRetGMV     = tRetUsers  * tAov * (1.25 + nvrRetAov[i] * 0.30);
    const nvrScale      = tGmv / (rawNewGMV + rawRetGMV);
    const tNewGMV       = Math.round(rawNewGMV * nvrScale);
    const tRetGMV       = tGmv - tNewGMV; // guarantees exact sum

    totalData.push({
      date,
      uu:             tUu,
      orders:         tOrders,
      aov:            tAov,
      gmv:            tGmv,
      gross_margin:   parseFloat(tGm.toFixed(4)),
      net_profit:     tNetP,
      newUsers:       tNewUsers,
      returningUsers: tRetUsers,
      newGMV:         tNewGMV,
      returningGMV:   tRetGMV,
    });

    // ── Step 2: Split total GMV into channels ────────────────────────────────────
    //
    // Channel GMV share adjustments:
    //   • Paid Ads spikes most on event/promo days (extra ad spend → extra traffic)
    //   • Organic share diluted on paid event days (higher paid share eats into organic)
    //   • LINE surges on push-notification days
    //   • Referral lags by ~1 day after promo events (word-of-mouth / sharing delay)
    //
    // After computing raw shares, they are normalised so Σ shares = 1.0,
    // guaranteeing Σ(channel_gmv) = total_gmv exactly.

    const rawShares = CH.map((ch, ci) => {
      let s = ch.baseGmvShare + cnShare[ci][i] * 0.04 * ch.shareVol;
      if (isSp) {
        if (ch.name === 'Paid Ads') s += 0.08; // promotions fuelled by ad spend
        if (ch.name === 'Organic')  s -= 0.04; // relatively smaller on paid-event days
      }
      if (isLine   && ch.name === 'LINE')     s += 0.07; // push notification burst
      if (isPostSp && ch.name === 'Referral') s += 0.04; // lagged viral/referral effect
      return Math.max(0.04, s); // floor each channel at 4%
    });
    const rawSum = rawShares.reduce((a, b) => a + b, 0);
    const shares = rawShares.map(s => s / rawSum); // Σ = 1.0

    CH.forEach((ch, ci) => {
      // GMV: exact split from total (guarantees Σ = tGmv)
      const chGmv = Math.round(tGmv * shares[ci]);

      // AOV: channel characteristic + independent noise
      const chAov = Math.max(800, Math.round(
        tAov * ch.aovMult * (1 + cnAov[ci][i] * 0.04),
      ));

      // Orders: derived from channel GMV and channel AOV
      const chOrders = Math.max(1, Math.round(chGmv / chAov));

      // UU: derived from orders and channel-adjusted CVR
      const chCvr = Math.min(0.07, Math.max(0.015, tCvr * ch.cvrMult));
      const chUu  = Math.max(1, Math.round(chOrders / chCvr));

      // Gross margin: total + channel adjustment + noise
      const chGm = Math.min(0.44, Math.max(0.32,
        tGm + ch.marginAdj + cnMargin[ci][i] * 0.008,
      ));

      // Net profit: channel GMV × channel margin × channel operating leverage
      const chOp  = Math.min(0.88, Math.max(0.52, tOpLev + cnOp[ci][i] * 0.05));
      const chNet = Math.round(chGmv * chGm * chOp);

      channelData.push({
        date,
        channel:      ch.name,
        uu:           chUu,
        orders:       chOrders,
        aov:          chAov,
        gmv:          chGmv,
        gross_margin: parseFloat(chGm.toFixed(4)),
        net_profit:   chNet,
      });
    });
  }

  return { channelData, totalData };
}
