import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Target, ShoppingCart, MousePointerClick, Users, Package,
  ArrowUpRight, ArrowDownRight, ChevronRight, ChevronsRight, GripVertical, ChevronDown,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import FilterBadges from '../../components/FilterBadges';
import { generateEcommerceData, type ChannelName, type EcommerceChannelRow } from '../../data/generateEcommerceData';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TableDataRow {
  date: string;
  weekday: string;
  month: string;
  channel: ChannelName;
  customerType: '新客' | '舊客';
  gender: '男' | '女' | '未知';
  isUsingCoCoin: '是' | '否';
  gmv: number;
  orders: number;
  aov: number;
  uu: number;
  cvr: number;
  atcRate: number;
  grossMarginPct: number;
  netProfit: number;
  targetPct: number;
  grossProfit: number;
  firstOrders: number;
  firstOrderRatio: number;
  coCoinUsage: number;
  newUsers: number;
  returningUsers: number;
  newGMV: number;
  returningGMV: number;
}

interface TimePeriod {
  key: string;
  label: string;
  start: string;
  end: string;
}

interface AggregatedPeriod extends TimePeriod {
  gmv: number;
  orders: number;
  aov: number;
  uu: number;
  cvr: number;
  atcRate: number;
  grossMarginPct: number;
  netProfit: number;
  targetPct: number;
  grossProfit: number;
  firstOrders: number;
  firstOrderRatio: number;
  coCoinUsage: number;
  newUsers: number;
  returningUsers: number;
  newGMV: number;
  returningGMV: number;
}

interface MetricDef {
  id: string;
  label: string;
  fmt: (v: number) => string;
  colorClass: (v: number, all: number[]) => string;
}

type TrendSeries = 'Total' | ChannelName;

const ALL_SERIES: TrendSeries[] = ['Total', 'Organic', 'Paid Ads', 'LINE', 'Referral'];

const SERIES_COLORS: Record<TrendSeries, string> = {
  'Total':    '#334155',
  'Organic':  '#6366f1',
  'Paid Ads': '#f59e0b',
  'LINE':     '#10b981',
  'Referral': '#a855f7',
};

// ─── Data Builder (called once via useState lazy init) ────────────────────────
function buildData(): { dailyTable: TableDataRow[]; channelData: EcommerceChannelRow[] } {
  const { totalData, channelData } = generateEcommerceData('2025-01-01', '2026-03-19', 42);

  // Pre-compute per-date scalars (atcRate, targetPct) from totalData
  let _ds = 1337;
  const _dr = () => { _ds = (_ds * 16807) % 2147483647; return (_ds - 1) / 2147483646; };
  const _dn = Array.from({ length: totalData.length * 2 }, _dr).map(v => v * 2 - 1);
  const perDate = new Map<string, { atcRate: number; targetPct: number }>();
  totalData.forEach((r, i) => {
    const cvr = r.uu > 0 ? r.orders / r.uu * 100 : 0;
    const atcRate = parseFloat(Math.min(18, Math.max(6, cvr * 3.8 + _dn[i * 2] * 1.4)).toFixed(1));
    const baseTarget = 270_000 * (1 + (i / (totalData.length - 1)) * 0.18);
    const targetPct = Math.min(99, Math.max(45, Math.round(r.gmv / baseTarget * 100 + _dn[i * 2 + 1] * 4)));
    perDate.set(r.date, { atcRate, targetPct });
  });

  // Split ratios: channel × [新客率, 舊客率]
  const CT_SPLIT: Record<string, [number, number]> = {
    'Organic':  [0.30, 0.70],
    'Paid Ads': [0.55, 0.45],
    'LINE':     [0.35, 0.65],
    'Referral': [0.45, 0.55],
  };
  // GMV split — new customers get a disproportionately smaller share of GMV (lower AOV)
  // Weighted avg: ~31% new GMV vs ~40% new UU → ~9pp gap in NVR card
  const CT_SPLIT_GMV: Record<string, [number, number]> = {
    'Organic':  [0.22, 0.78],
    'Paid Ads': [0.45, 0.55],
    'LINE':     [0.26, 0.74],
    'Referral': [0.33, 0.67],
  };
  const G_SPLIT = [0.47, 0.38, 0.15]; // 女, 男, 未知
  const GENDERS = ['女', '男', '未知'] as const;
  const CTS     = ['新客', '舊客'] as const;

  // Sub-row PRNG (seed 9876); exactly 3 calls per sub-row for determinism
  let _ss = 9876;
  const _sr = () => { _ss = (_ss * 16807) % 2147483647; return (_ss - 1) / 2147483646; };

  const dailyTable: TableDataRow[] = [];
  for (const chRow of channelData) {
    const d   = new Date(chRow.date);
    const dow = d.getDay();
    const mo  = d.getMonth() + 1;
    const info = perDate.get(chRow.date);
    if (!info) continue;

    const ch       = chRow.channel as ChannelName;
    const ctSplit  = CT_SPLIT[ch]     ?? [0.40, 0.60];
    const gmvSplit = CT_SPLIT_GMV[ch] ?? [0.35, 0.65];

    for (let ci = 0; ci < 2; ci++) {
      for (let gi = 0; gi < 3; gi++) {
        const uuRatio  = ctSplit[ci]  * G_SPLIT[gi];
        const gmvRatio = gmvSplit[ci] * G_SPLIT[gi];

        const subGmv        = chRow.gmv        * gmvRatio;
        const subOrders     = Math.max(0, Math.round(chRow.orders * uuRatio));
        const subUu         = Math.max(0, Math.round(chRow.uu     * uuRatio));
        const subNetProfit  = chRow.net_profit * gmvRatio;
        const grossMarginPct = parseFloat((chRow.gross_margin * 100).toFixed(1));
        const subGrossProfit = Math.round(subGmv * chRow.gross_margin);

        // 3 deterministic PRNG calls per sub-row
        _sr();                   // reserved — keeps sequence stable
        const noiseFO = _sr();   // firstOrders variance
        const noiseCo = _sr();   // co-coin decision + rate

        const ct = CTS[ci];
        const firstOrders = ct === '新客'
          ? Math.round(subOrders * Math.min(0.98, Math.max(0.65, 0.82 + (noiseFO * 2 - 1) * 0.08)))
          : 0;
        const firstOrderRatio = subOrders > 0
          ? parseFloat((firstOrders / subOrders * 100).toFixed(1))
          : 0;

        const isUsingCoCoin = noiseCo >= 0.45 ? '是' : '否';
        const coCoinUsage   = isUsingCoCoin === '是'
          ? Math.round(subGmv * (0.06 + noiseCo * 0.10))
          : 0;

        const cvr = subUu > 0 ? parseFloat((subOrders / subUu * 100).toFixed(2)) : 0;

        dailyTable.push({
          date:           chRow.date,
          weekday:        dow === 0 || dow === 6 ? '週末' : '工作日',
          month:          `${mo}月`,
          channel:        ch,
          customerType:   ct,
          gender:         GENDERS[gi],
          isUsingCoCoin,
          gmv:            subGmv,
          orders:         subOrders,
          aov:            subOrders > 0 ? Math.round(subGmv / subOrders) : 0,
          uu:             subUu,
          cvr,
          atcRate:        info.atcRate,
          grossMarginPct,
          netProfit:      subNetProfit,
          targetPct:      info.targetPct,
          grossProfit:    subGrossProfit,
          firstOrders,
          firstOrderRatio,
          coCoinUsage,
          newUsers:       ct === '新客' ? subUu  : 0,
          returningUsers: ct === '舊客' ? subUu  : 0,
          newGMV:         ct === '新客' ? subGmv : 0,
          returningGMV:   ct === '舊客' ? subGmv : 0,
        });
      }
    }
  }

  return { dailyTable, channelData };
}

// ─── Metric Definitions ───────────────────────────────────────────────────────
const ALL_METRIC_DEFS: MetricDef[] = [
  // 流量與轉換
  { id: 'uu',             label: 'UU',         fmt: v => v.toLocaleString(),                         colorClass: () => 'text-slate-600' },
  { id: 'cvr',            label: 'CVR %',      fmt: v => `${v.toFixed(2)}%`,                        colorClass: (v, a) => v >= Math.max(...a) * 0.95 ? 'text-emerald-700 font-bold' : 'text-slate-600' },
  { id: 'atcRate',        label: '加購率',     fmt: v => `${v.toFixed(1)}%`,                        colorClass: () => 'text-slate-600' },
  // 營收指標
  { id: 'gmv',            label: 'GMV',        fmt: v => `NT$${v.toLocaleString()}`,                colorClass: (v, a) => v >= Math.max(...a) * 0.9 ? 'text-indigo-700 font-bold' : 'text-slate-700' },
  { id: 'orders',         label: '訂單數',     fmt: v => v.toLocaleString(),                         colorClass: (v, a) => v >= Math.max(...a) * 0.9 ? 'text-indigo-700 font-bold' : 'text-slate-600' },
  { id: 'aov',            label: 'AOV',        fmt: v => `NT$${v.toLocaleString()}`,                colorClass: (v, a) => v >= Math.max(...a) * 0.95 ? 'text-sky-700 font-bold' : 'text-slate-600' },
  { id: 'firstOrders',    label: '首購訂單數', fmt: v => isNaN(v) ? '—' : v.toLocaleString(),                         colorClass: (v, a) => !isNaN(v) && v >= Math.max(...a.filter(x => !isNaN(x))) * 0.9 ? 'text-indigo-700 font-bold' : 'text-slate-600' },
  { id: 'firstOrderRatio',label: '首購比例',   fmt: v => isNaN(v) ? '—' : `${v.toFixed(1)}%`,                        colorClass: (v) => !isNaN(v) && v >= 40 ? 'text-emerald-700 font-bold' : 'text-slate-600' },
  // 獲利指標
  { id: 'grossProfit',    label: '毛利金額',   fmt: v => isNaN(v) ? '—' : `NT$${Math.round(v).toLocaleString()}`,    colorClass: (v, a) => !isNaN(v) && v >= Math.max(...a.filter(x => !isNaN(x))) * 0.9 ? 'text-emerald-700 font-bold' : 'text-slate-600' },
  { id: 'grossMarginPct', label: '毛利率',     fmt: v => `${v.toFixed(1)}%`,                        colorClass: (v) => v >= 38 ? 'text-emerald-700 font-bold' : v >= 36 ? 'text-amber-600' : 'text-rose-500 font-bold' },
  { id: 'netProfit',      label: '淨獲利',     fmt: v => `NT$${v.toLocaleString()}`,                colorClass: (v, a) => v >= Math.max(...a) * 0.9 ? 'text-emerald-700 font-bold' : 'text-slate-600' },
  // 行銷/成本指標
  { id: 'coCoinUsage',    label: 'Co幣使用額', fmt: v => isNaN(v) ? '—' : `NT$${Math.round(v).toLocaleString()}`,    colorClass: () => 'text-slate-600' },
  // 目標追蹤
  { id: 'targetPct',      label: '目標達成率', fmt: v => `${v}%`,                                   colorClass: (v) => v >= 90 ? 'text-emerald-700 font-bold' : v >= 75 ? 'text-amber-600' : 'text-rose-500 font-bold' },
];

const OVERVIEW_METRIC_GROUPS = [
  { label: '流量與轉換', metrics: [{ id: 'uu', label: 'UU' }, { id: 'cvr', label: 'CVR %' }, { id: 'atcRate', label: '加購率' }] },
  { label: '營收指標',   metrics: [{ id: 'gmv', label: 'GMV' }, { id: 'orders', label: '訂單數' }, { id: 'aov', label: 'AOV' }, { id: 'firstOrders', label: '首購訂單數' }, { id: 'firstOrderRatio', label: '首購比例' }] },
  { label: '獲利指標',   metrics: [{ id: 'grossProfit', label: '毛利金額' }, { id: 'grossMarginPct', label: '毛利率' }, { id: 'netProfit', label: '淨獲利' }] },
  { label: '行銷/成本指標', metrics: [{ id: 'coCoinUsage', label: 'Co幣使用額' }] },
  { label: '目標追蹤',   metrics: [{ id: 'targetPct', label: '目標達成率' }] },
];

const DEFAULT_VISIBLE_METRICS = ['gmv', 'orders', 'aov', 'grossMarginPct', 'netProfit', 'targetPct'];

const OVERVIEW_DIMENSION_FIELDS = [
  { id: 'gender',       label: '性別',        options: [{ id: '女', label: '女' }, { id: '男', label: '男' }, { id: '未知', label: '未知' }] },
  { id: 'isUsingCoCoin',label: '是否使用Co幣', options: [{ id: '是', label: '是' }, { id: '否', label: '否' }] },
  { id: 'channel',      label: '渠道',        options: [{ id: 'Organic', label: 'Organic' }, { id: 'Paid Ads', label: 'Paid Ads' }, { id: 'LINE', label: 'LINE' }, { id: 'Referral', label: 'Referral' }] },
  { id: 'customerType', label: '新舊客',       options: [{ id: '新客', label: '新客' }, { id: '舊客', label: '舊客' }] },
];

const DATE_PRESETS = ['近7天', '近30天', '近90天', '本月', '本季', '本年', '自訂區間'];




// ─── Time Utilities ───────────────────────────────────────────────────────────
const TODAY = '2026-03-19';
const fmt = (d: Date) => d.toISOString().slice(0, 10);

function computeDateRange(preset: string, customStart: string, customEnd: string): { start: string; end: string } {
  const today = new Date(TODAY);
  switch (preset) {
    case '近7天': { const d = new Date(TODAY); d.setDate(d.getDate() - 6); return { start: fmt(d), end: TODAY }; }
    case '近30天': { const d = new Date(TODAY); d.setDate(d.getDate() - 29); return { start: fmt(d), end: TODAY }; }
    case '近90天': { const d = new Date(TODAY); d.setDate(d.getDate() - 89); return { start: fmt(d), end: TODAY }; }
    case '本月': return { start: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`, end: TODAY };
    case '本季': { const qStart = Math.floor(today.getMonth() / 3) * 3; return { start: fmt(new Date(today.getFullYear(), qStart, 1)), end: TODAY }; }
    case '本年': return { start: `${today.getFullYear()}-01-01`, end: TODAY };
    case '自訂區間': return { start: customStart, end: customEnd };
    default: { const d = new Date(TODAY); d.setDate(d.getDate() - 29); return { start: fmt(d), end: TODAY }; }
  }
}

function generateTimePeriods(start: string, end: string, granularity: string): TimePeriod[] {
  const startD = new Date(start);
  const endD = new Date(end);

  if (granularity === '日') {
    const periods: TimePeriod[] = [];
    const d = new Date(startD);
    while (d <= endD) {
      const iso = fmt(d);
      periods.push({ key: iso, label: `${d.getMonth() + 1}/${d.getDate()}`, start: iso, end: iso });
      d.setDate(d.getDate() + 1);
    }
    return periods;
  }

  if (granularity === '週') {
    const periods: TimePeriod[] = [];
    // Move to Monday of the week containing startD
    const cursor = new Date(startD);
    const dow = cursor.getDay();
    cursor.setDate(cursor.getDate() - (dow === 0 ? 6 : dow - 1));
    while (cursor <= endD) {
      const wkStart = new Date(cursor);
      const wkEnd = new Date(cursor);
      wkEnd.setDate(wkEnd.getDate() + 6);
      const cs = wkStart < startD ? startD : wkStart;
      const ce = wkEnd > endD ? endD : wkEnd;
      const csIso = fmt(cs);
      const ceIso = fmt(ce);
      const sm = cs.getMonth() + 1; const sd = cs.getDate();
      const em = ce.getMonth() + 1; const ed = ce.getDate();
      const label = sm === em ? `${sm}/${sd}~${ed}` : `${sm}/${sd}~${em}/${ed}`;
      periods.push({ key: fmt(wkStart), label, start: csIso, end: ceIso });
      cursor.setDate(cursor.getDate() + 7);
    }
    return periods;
  }

  if (granularity === '月') {
    const periods: TimePeriod[] = [];
    let y = startD.getFullYear(); let m = startD.getMonth();
    while (true) {
      const mStart = new Date(y, m, 1);
      if (mStart > endD) break;
      const mEnd = new Date(y, m + 1, 0); // last calendar day of this month
      const cs = mStart < startD ? startD : mStart;
      const ce = mEnd > endD ? endD : mEnd;
      // Mark as MTD when the calendar month extends beyond the range end
      // (i.e. the month is in-progress / not yet complete)
      const isMtd = mEnd > endD;
      const baseLabel = y === 2026 ? `${m + 1}月` : `${y}/${m + 1}月`;
      const label = isMtd ? `${baseLabel} MTD` : baseLabel;
      periods.push({ key: fmt(mStart), label, start: fmt(cs), end: fmt(ce) });
      m++; if (m > 11) { m = 0; y++; }
    }
    return periods;
  }

  if (granularity === '季') {
    const periods: TimePeriod[] = [];
    let y = startD.getFullYear(); let q = Math.floor(startD.getMonth() / 3);
    while (true) {
      const qStart = new Date(y, q * 3, 1);
      if (qStart > endD) break;
      const qEnd = new Date(y, q * 3 + 3, 0);
      const cs = qStart < startD ? startD : qStart;
      const ce = qEnd > endD ? endD : qEnd;
      periods.push({ key: `${y}-Q${q + 1}`, label: `${y}Q${q + 1}`, start: fmt(cs), end: fmt(ce) });
      q++; if (q > 3) { q = 0; y++; }
    }
    return periods;
  }

  // 年
  const periods: TimePeriod[] = [];
  let y = startD.getFullYear();
  while (true) {
    const yStart = new Date(y, 0, 1);
    if (yStart > endD) break;
    const yEnd = new Date(y, 11, 31);
    const cs = yStart < startD ? startD : yStart;
    const ce = yEnd > endD ? endD : yEnd;
    periods.push({ key: `${y}`, label: `${y}年`, start: fmt(cs), end: fmt(ce) });
    y++;
  }
  return periods;
}

function aggregateRows(rows: TableDataRow[]): Omit<AggregatedPeriod, keyof TimePeriod> {
  if (rows.length === 0) return {
    gmv: 0, orders: 0, aov: 0, uu: 0, cvr: 0, atcRate: 0, grossMarginPct: 0,
    netProfit: 0, targetPct: 0, grossProfit: 0, firstOrders: 0, firstOrderRatio: 0, coCoinUsage: 0,
    newUsers: 0, returningUsers: 0, newGMV: 0, returningGMV: 0,
  };
  const totalGmv         = rows.reduce((s, r) => s + r.gmv,         0);
  const totalOrders      = rows.reduce((s, r) => s + r.orders,      0);
  const totalUu          = rows.reduce((s, r) => s + r.uu,          0);
  const totalNetProfit   = rows.reduce((s, r) => s + r.netProfit,   0);
  const totalGrossProfit = rows.reduce((s, r) => s + (r.grossProfit || 0), 0);
  const totalFirstOrders = rows.reduce((s, r) => s + (r.firstOrders || 0), 0);
  const totalCoCoinUsage = rows.reduce((s, r) => s + (r.coCoinUsage || 0), 0);
  return {
    gmv:            totalGmv,
    orders:         totalOrders,
    aov:            totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0,
    uu:             totalUu,
    cvr:            totalUu > 0 ? parseFloat((totalOrders / totalUu * 100).toFixed(2)) : 0,
    atcRate:        parseFloat((rows.reduce((s, r) => s + r.atcRate, 0) / rows.length).toFixed(1)),
    grossMarginPct: totalGmv > 0 ? parseFloat((totalGrossProfit / totalGmv * 100).toFixed(1)) : 0,
    netProfit:      totalNetProfit,
    targetPct:      Math.round(rows.reduce((s, r) => s + r.targetPct, 0) / rows.length),
    grossProfit:    totalGrossProfit,
    firstOrders:    totalFirstOrders,
    firstOrderRatio: totalOrders > 0 ? parseFloat((totalFirstOrders / totalOrders * 100).toFixed(1)) : 0,
    coCoinUsage:    totalCoCoinUsage,
    newUsers:       rows.reduce((s, r) => s + (r.newUsers       || 0), 0),
    returningUsers: rows.reduce((s, r) => s + (r.returningUsers || 0), 0),
    newGMV:         rows.reduce((s, r) => s + (r.newGMV         || 0), 0),
    returningGMV:   rows.reduce((s, r) => s + (r.returningGMV   || 0), 0),
  };
}

// ─── XoX Types ────────────────────────────────────────────────────────────────
type XoXType = 'WoW' | 'MoM' | 'QoQ' | 'YoY';

const XOX_FULL_LABELS: Record<XoXType, string> = {
  WoW: 'Week over Week（較上週）',
  MoM: 'Month over Month（較上月）',
  QoQ: 'Quarter over Quarter（較上季）',
  YoY: 'Year over Year（較去年同期）',
};

function shiftDateRange(start: string, end: string, xox: XoXType): { start: string; end: string } {
  const s = new Date(start);
  const e = new Date(end);
  switch (xox) {
    case 'WoW': s.setDate(s.getDate() - 7); e.setDate(e.getDate() - 7); break;
    case 'MoM': s.setMonth(s.getMonth() - 1); e.setMonth(e.getMonth() - 1); break;
    case 'QoQ': s.setMonth(s.getMonth() - 3); e.setMonth(e.getMonth() - 3); break;
    case 'YoY': s.setFullYear(s.getFullYear() - 1); e.setFullYear(e.getFullYear() - 1); break;
  }
  return { start: fmt(s), end: fmt(e) };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtNT = (v: number) => `NT$${v.toLocaleString()}`;

function Delta({ up, val }: { up: boolean; val: string }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 w-fit ${up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{val}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OverviewDashboard() {
  const navigate = useNavigate();

  // ── Source data (built once on mount) ─────────────────────────────────────
  const [{ dailyTable, channelData }] = useState(buildData);

  // ── Unified time control (shared by table + chart) ─────────────────────────
  const [dateRangeType, setDateRangeType] = useState('近30天');
  const [timeUnit, setTimeUnit] = useState('日');
  const [customStart, setCustomStart] = useState('2026-02-18');
  const [customEnd, setCustomEnd] = useState('2026-03-19');

  // ── Metric + dimension control ─────────────────────────────────────────────
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_VISIBLE_METRICS);
  const [selectedDimensionsMap, setSelectedDimensionsMap] = useState<Record<string, string[]>>({});

  // ── Matrix: metric row reorder (drag-and-drop) ─────────────────────────────
  const [metricRowOrder, setMetricRowOrder] = useState<string[]>([]);
  const dragRowIdRef = useRef<string | null>(null);

  // ── Chart metric toggle ────────────────────────────────────────────────────
  const [trendMetric, setTrendMetric] = useState<'gmv' | 'netProfit' | 'aov'>('gmv');

  // ── Period comparison ──────────────────────────────────────────────────────
  const [showComparison, setShowComparison] = useState(true);

  // ── Series selector for trend chart (Total + channels) ───────────────────
  const [selectedSeries, setSelectedSeries] = useState<TrendSeries[]>(['Total']);
  const [seriesDropdownOpen, setSeriesDropdownOpen] = useState(false);

  // ─── Derived Data ───────────────────────────────────────────────────────────

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => computeDateRange(dateRangeType, customStart, customEnd),
    [dateRangeType, customStart, customEnd],
  );

  // 1. Dimension pre-filter
  const dimFiltered = useMemo(() => {
    const hasFilter = Object.values(selectedDimensionsMap).some(v => v.length > 0);
    if (!hasFilter) return dailyTable;
    return dailyTable.filter(row => {
      for (const [fId, vals] of Object.entries(selectedDimensionsMap)) {
        if (vals.length > 0 && !vals.includes((row as any)[fId])) return false;
      }
      return true;
    });
  }, [selectedDimensionsMap]);

  // 2. Date range filter
  const rangeFiltered = useMemo(
    () => dimFiltered.filter(r => r.date >= rangeStart && r.date <= rangeEnd),
    [dimFiltered, rangeStart, rangeEnd],
  );

  // 3. Time periods from unified control
  const timePeriods = useMemo(
    () => generateTimePeriods(rangeStart, rangeEnd, timeUnit),
    [rangeStart, rangeEnd, timeUnit],
  );

  // 4. Aggregate per period
  const periodData: AggregatedPeriod[] = useMemo(() =>
    timePeriods.map(p => ({
      ...p,
      ...aggregateRows(rangeFiltered.filter(r => r.date >= p.start && r.date <= p.end)),
    })),
    [timePeriods, rangeFiltered],
  );

  // 5. Ordered active metric rows
  const activeMetricDefs = useMemo(() => {
    const base = ALL_METRIC_DEFS.filter(m => selectedMetrics.includes(m.id));
    if (metricRowOrder.length === 0) return base;
    const orderMap = new Map(metricRowOrder.map((id, i) => [id, i]));
    return [...base].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  }, [selectedMetrics, metricRowOrder]);

  // 6. XoX type (auto-derived from timeUnit)
  const xoxType = useMemo((): XoXType => {
    if (timeUnit === '日' || timeUnit === '週') return 'WoW';
    if (timeUnit === '月') return 'MoM';
    if (timeUnit === '季') return 'QoQ';
    return 'YoY';
  }, [timeUnit]);

  // 7. Comparison period
  const { start: compStart, end: compEnd } = useMemo(
    () => showComparison ? shiftDateRange(rangeStart, rangeEnd, xoxType) : { start: '', end: '' },
    [showComparison, rangeStart, rangeEnd, xoxType],
  );
  const compRangeFiltered = useMemo(
    () => showComparison && compStart ? dimFiltered.filter(r => r.date >= compStart && r.date <= compEnd) : [],
    [showComparison, compStart, compEnd, dimFiltered],
  );
  const compTimePeriods = useMemo(
    () => showComparison && compStart ? generateTimePeriods(compStart, compEnd, timeUnit) : [],
    [showComparison, compStart, compEnd, timeUnit],
  );
  const compPeriodData: AggregatedPeriod[] = useMemo(
    () => showComparison
      ? compTimePeriods.map(p => ({ ...p, ...aggregateRows(compRangeFiltered.filter(r => r.date >= p.start && r.date <= p.end)) }))
      : [],
    [showComparison, compTimePeriods, compRangeFiltered],
  );

  // 8. Chart data — uu always total; one key per selected series
  const channelPeriodData = useMemo(() => {
    const channels = selectedSeries.filter((s): s is ChannelName => s !== 'Total');
    if (channels.length === 0) return {} as Record<ChannelName, Array<{ gmv: number; netProfit: number; aov: number }>>;
    const result: Partial<Record<ChannelName, Array<{ gmv: number; netProfit: number; aov: number }>>> = {};
    for (const ch of channels) {
      const chRows = channelData.filter(r => r.channel === ch && r.date >= rangeStart && r.date <= rangeEnd);
      result[ch] = timePeriods.map(p => {
        const rows = chRows.filter(r => r.date >= p.start && r.date <= p.end);
        if (rows.length === 0) return { gmv: 0, netProfit: 0, aov: 0 };
        const g = rows.reduce((s, r) => s + r.gmv, 0);
        const o = rows.reduce((s, r) => s + r.orders, 0);
        return { gmv: g, netProfit: rows.reduce((s, r) => s + r.net_profit, 0), aov: o > 0 ? Math.round(g / o) : 0 };
      });
    }
    return result as Record<ChannelName, Array<{ gmv: number; netProfit: number; aov: number }>>;
  }, [selectedSeries, channelData, timePeriods, rangeStart, rangeEnd]);

  const totalOnlyMode = selectedSeries.length === 1 && selectedSeries[0] === 'Total';

  // Auto-sync showComparison with totalOnlyMode (on/off when switching between Total-only and multi-series)
  useEffect(() => {
    setShowComparison(totalOnlyMode);
  }, [totalOnlyMode]);

  const chartData = useMemo(() => {
    return periodData.map((p, i) => {
      const entry: Record<string, unknown> = { label: p.label, uu: p.uu };
      if (selectedSeries.includes('Total')) {
        entry['Total'] = (p as any)[trendMetric] as number;
        if (totalOnlyMode && showComparison) entry['prev'] = (compPeriodData[i] as any)?.[trendMetric] ?? null;
      }
      for (const ch of selectedSeries) {
        if (ch === 'Total') continue;
        entry[ch] = channelPeriodData[ch as ChannelName]?.[i]?.[trendMetric] ?? null;
      }
      return entry;
    });
  }, [periodData, trendMetric, showComparison, compPeriodData, selectedSeries, channelPeriodData, totalOnlyMode]);

  // 9. KPI card data — computed from rangeFiltered vs prior same-length period
  const kpi = useMemo(() => {
    const curr = aggregateRows(rangeFiltered);
    const rangeStartD = new Date(rangeStart);
    const rangeEndD   = new Date(rangeEnd);
    const days = Math.round((rangeEndD.getTime() - rangeStartD.getTime()) / 86400000);
    const priorEndD   = new Date(rangeStartD); priorEndD.setDate(priorEndD.getDate() - 1);
    const priorStartD = new Date(priorEndD);   priorStartD.setDate(priorStartD.getDate() - days);
    const prior = aggregateRows(dailyTable.filter(r => r.date >= fmt(priorStartD) && r.date <= fmt(priorEndD)));
    const pct = (c: number, p: number) => {
      if (p === 0) return { delta: '—', up: true };
      const d = (c - p) / p * 100;
      return { delta: `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`, up: d >= 0 };
    };
    const pp = (c: number, p: number) => {
      const d = c - p;
      return { delta: `${d >= 0 ? '+' : ''}${d.toFixed(1)}pp`, up: d >= 0 };
    };
    const gmvD   = pct(curr.gmv,            prior.gmv);
    const aovD   = pct(curr.aov,            prior.aov);
    const npD    = pct(curr.netProfit,       prior.netProfit);
    const tgtD   = pp(curr.targetPct,        prior.targetPct);
    const cvrD   = pp(curr.cvr,              prior.cvr);
    const marginD = pp(curr.grossMarginPct,  prior.grossMarginPct);
    const uuD    = pct(curr.uu,              prior.uu);
    const ordD   = pct(curr.orders,          prior.orders);
    return {
      gmv: curr.gmv,             gmvDelta: gmvD.delta,        gmvUp: gmvD.up,
      target: curr.targetPct,    targetDelta: tgtD.delta,     targetUp: tgtD.up,
      aov: curr.aov,             aovDelta: aovD.delta,        aovUp: aovD.up,
      cvr: curr.cvr,             cvrDelta: cvrD.delta,        cvrUp: cvrD.up,
      grossMargin: curr.grossMarginPct, marginDelta: marginD.delta, marginUp: marginD.up,
      netProfit: curr.netProfit, netProfitDelta: npD.delta,   netProfitUp: npD.up,
      uu: curr.uu,               uuDelta: uuD.delta,          uuUp: uuD.up,
      orders: curr.orders,       ordersDelta: ordD.delta,     ordersUp: ordD.up,
    };
  }, [rangeFiltered, dailyTable, rangeStart, rangeEnd]);

  // 10. Funnel data — computed from rangeFiltered
  const funnelData = useMemo(() => {
    const agg = aggregateRows(rangeFiltered);
    const uu      = agg.uu;
    const atc     = Math.round(uu * agg.atcRate / 100);
    const orders  = agg.orders;
    const checkout = Math.max(orders, Math.round(atc * 0.70));
    return [
      { name: 'UU（不重複訪客）', value: uu,       fill: '#e0e7ff', rate: null as null | number },
      { name: '加入購物車',       value: atc,      fill: '#818cf8', rate: uu       > 0 ? parseFloat((atc      / uu       * 100).toFixed(1)) : 0 },
      { name: '進入結帳',         value: checkout, fill: '#6366f1', rate: atc      > 0 ? parseFloat((checkout / atc      * 100).toFixed(1)) : 0 },
      { name: '完成訂單',         value: orders,   fill: '#4338ca', rate: checkout > 0 ? parseFloat((orders   / checkout * 100).toFixed(1)) : 0 },
    ];
  }, [rangeFiltered]);

  // 11. Co幣 & 淨利率 metrics — computed from rangeFiltered vs prior period
  const coinsMetrics = useMemo(() => {
    const curr = aggregateRows(rangeFiltered);
    const rangeStartD = new Date(rangeStart);
    const rangeEndD   = new Date(rangeEnd);
    const days = Math.round((rangeEndD.getTime() - rangeStartD.getTime()) / 86400000);
    const priorEndD   = new Date(rangeStartD); priorEndD.setDate(priorEndD.getDate() - 1);
    const priorStartD = new Date(priorEndD);   priorStartD.setDate(priorStartD.getDate() - days);
    const priorRows = dailyTable.filter(r => r.date >= fmt(priorStartD) && r.date <= fmt(priorEndD));
    const prior = aggregateRows(priorRows);

    const currNetRate  = curr.gmv  > 0 ? curr.netProfit  / curr.gmv  * 100 : 0;
    const priorNetRate = prior.gmv > 0 ? prior.netProfit / prior.gmv * 100 : 0;
    const netRateDelta = currNetRate - priorNetRate;

    const currBurnRate  = curr.gmv  > 0 ? curr.coCoinUsage  / curr.gmv  * 100 : 0;
    const priorBurnRate = prior.gmv > 0 ? prior.coCoinUsage / prior.gmv * 100 : 0;
    const burnDelta = currBurnRate - priorBurnRate;

    const currCoOrders  = rangeFiltered.reduce((s, r) => s + (r.isUsingCoCoin === '是' ? r.orders : 0), 0);
    const priorCoOrders = priorRows.reduce((s, r) => s + (r.isUsingCoCoin === '是' ? r.orders : 0), 0);
    const currPen  = curr.orders  > 0 ? currCoOrders  / curr.orders  * 100 : 0;
    const priorPen = prior.orders > 0 ? priorCoOrders / prior.orders * 100 : 0;
    const penDelta = currPen - priorPen;

    const fmtPP = (d: number) => `${d >= 0 ? '+' : ''}${d.toFixed(1)}pp`;
    return {
      netProfitRate: currNetRate,
      npRateDelta: fmtPP(netRateDelta), npRateUp: netRateDelta >= 0,
      burnRate:    currBurnRate,
      burnDelta:   fmtPP(burnDelta),    burnUp:    burnDelta <= 0,
      burnAmount:  curr.coCoinUsage,
      penetration: currPen,
      penDelta:    fmtPP(penDelta),     penUp:     penDelta >= 0,
    };
  }, [rangeFiltered, dailyTable, rangeStart, rangeEnd]);

  // 7. Trend chart — same periodData, different metric
  const trendMeta = {
    gmv:       { label: 'GMV',    color: '#6366f1', fmt: (v: number) => `NT$${(v / 10000).toFixed(0)}萬` },
    netProfit: { label: '淨獲利', color: '#10b981', fmt: (v: number) => `NT$${(v / 10000).toFixed(0)}萬` },
    aov:       { label: 'AOV',    color: '#f59e0b', fmt: (v: number) => `NT$${v.toLocaleString()}` },
  } as const;

  // ── Channel distribution (for revenue chart, synced to time range) ────────
  const channelDistribution = useMemo(() => {
    const channels: ChannelName[] = ['Organic', 'Paid Ads', 'LINE', 'Referral'];
    const rows = channelData.filter(r => r.date >= rangeStart && r.date <= rangeEnd);
    const totalGmv = rows.reduce((s, r) => s + r.gmv, 0);
    return channels.map(ch => ({
      name: ch,
      gmv: rows.filter(r => r.channel === ch).reduce((s, r) => s + r.gmv, 0),
      color: SERIES_COLORS[ch],
      totalGmv,
    }));
  }, [channelData, rangeStart, rangeEnd]);

  // ── New vs Returning — grouped bar data ───────────────────────────────────
  const nvrData = useMemo(() => {
    const totalUu  = rangeFiltered.reduce((s, r) => s + r.uu,  0);
    const totalGmv = rangeFiltered.reduce((s, r) => s + r.gmv, 0);
    return (['新客', '舊客'] as const).map(ct => {
      const rows = rangeFiltered.filter(r => r.customerType === ct);
      const uu  = rows.reduce((s, r) => s + r.uu,  0);
      const gmv = rows.reduce((s, r) => s + r.gmv, 0);
      return {
        name:     ct === '新客' ? '新客' : '回購客',
        人數佔比: totalUu  > 0 ? Math.round(uu  / totalUu  * 100) : 0,
        GMV佔比:  totalGmv > 0 ? Math.round(gmv / totalGmv * 100) : 0,
        人均GMV:  uu > 0 ? Math.round(gmv / uu) : 0,
      };
    });
  }, [rangeFiltered]);

  // ── Dimension filter badges ────────────────────────────────────────────────
  const dimFilterBadges = useMemo(() => {
    const badges: { id: string; label: string; value: string }[] = [];
    Object.entries(selectedDimensionsMap).forEach(([fId, vals]) => {
      if (!vals.length) return;
      const field = OVERVIEW_DIMENSION_FIELDS.find(f => f.id === fId);
      badges.push({ id: `dim-${fId}`, label: field?.label ?? fId, value: vals.map(v => field?.options.find(o => o.id === v)?.label ?? v).join(', ') });
    });
    return badges;
  }, [selectedDimensionsMap]);

  const removeDimFilter = (id: string) => {
    if (id.startsWith('dim-')) {
      const fId = id.replace('dim-', '');
      setSelectedDimensionsMap(prev => ({ ...prev, [fId]: [] }));
    }
  };

  const clearAllDimFilters = () => setSelectedDimensionsMap({});

  // ── Matrix row drag handlers ───────────────────────────────────────────────
  const handleRowDragStart = (e: React.DragEvent, id: string) => {
    dragRowIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleRowDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const dragId = dragRowIdRef.current;
    if (!dragId || dragId === targetId) return;
    const ids = activeMetricDefs.map(m => m.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    setMetricRowOrder(ids);
    dragRowIdRef.current = null;
  };

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const trendTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const meta = trendMeta[trendMetric];
    const uuEntry      = payload.find((p: any) => p.dataKey === 'uu');
    const prevEntry    = payload.find((p: any) => p.dataKey === 'prev');
    const seriesRows   = payload.filter((p: any) => p.dataKey !== 'uu' && p.dataKey !== 'prev');
    const totalRow     = seriesRows.find((p: any) => p.dataKey === 'Total');
    const prevVal: number | null = prevEntry?.value ?? null;
    const totalVal: number | null = totalRow?.value ?? null;
    const deltaStr = totalVal != null && prevVal != null && prevVal !== 0
      ? `${totalVal >= prevVal ? '+' : ''}${((totalVal - prevVal) / prevVal * 100).toFixed(1)}%`
      : null;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs min-w-[180px]">
        <p className="font-bold text-slate-700 mb-2">{label}</p>
        {uuEntry?.value != null && (
          <p className="flex justify-between gap-4 mb-1 text-indigo-300">
            <span>UU</span>
            <span className="font-mono font-bold">{(uuEntry.value as number).toLocaleString()}</span>
          </p>
        )}
        {seriesRows.map((entry: any) => (
          <p key={entry.dataKey} className="flex justify-between gap-4 mb-0.5" style={{ color: SERIES_COLORS[entry.dataKey as TrendSeries] ?? entry.color }}>
            <span>{entry.dataKey === 'Total' ? meta.label : entry.dataKey}</span>
            <span className="font-mono font-bold">{meta.fmt(entry.value)}</span>
          </p>
        ))}
        {prevVal != null && (
          <p className="flex justify-between gap-4 mb-0.5 text-slate-400">
            <span title={XOX_FULL_LABELS[xoxType]}>{xoxType}</span>
            <span className="font-mono font-bold">{meta.fmt(prevVal)}</span>
          </p>
        )}
        {deltaStr && (
          <p className={`text-right font-bold mt-1 pt-1 border-t border-slate-100 ${totalVal! >= prevVal! ? 'text-emerald-600' : 'text-rose-500'}`}>
            {deltaStr}
          </p>
        )}
      </div>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">電商總覽</h1>
        <p className="mt-1 text-sm text-slate-500">
          整體業績快照 — 快速判斷流量、轉換、客單與獲利，作為各模組深入分析的入口。
        </p>
      </div>

      {/* ── [A] Unified control bar ─────────────────────────────────────────── */}
      <AnalyticsControlBar
        metricGroups={OVERVIEW_METRIC_GROUPS}
        dimensionFields={OVERVIEW_DIMENSION_FIELDS}
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
        onRestoreDefaultMetrics={() => setSelectedMetrics(DEFAULT_VISIBLE_METRICS)}
        metricsLabel="指標選擇"
        selectedDimensionsMap={selectedDimensionsMap}
        onDimensionsMapChange={setSelectedDimensionsMap}
        datePresets={DATE_PRESETS}
        dateRangeType={dateRangeType}
        onDateRangeTypeChange={setDateRangeType}
        customStart={customStart}
        onCustomStartChange={setCustomStart}
        customEnd={customEnd}
        onCustomEndChange={setCustomEnd}
        timeUnit={timeUnit}
        onTimeUnitChange={setTimeUnit}
        hideTimeGranularity={false}
        singleRowLayout={true}
      />

      {/* Dimension filter badges */}
      {dimFilterBadges.length > 0 && (
        <FilterBadges filters={dimFilterBadges} onRemove={removeDimFilter} onClearAll={clearAllDimFilters} />
      )}

      {/* ── [B] KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, bg: 'bg-indigo-50', color: 'text-indigo-600', label: 'GMV', value: fmtNT(kpi.gmv), delta: kpi.gmvDelta, up: kpi.gmvUp, onClick: () => navigate('/traffic/channel-performance') },
          { icon: Target, bg: 'bg-amber-50', color: 'text-amber-600', label: '目標達成率', value: `${kpi.target}%`, delta: kpi.targetDelta, up: kpi.targetUp, progress: kpi.target },
          { icon: ShoppingCart, bg: 'bg-sky-50', color: 'text-sky-600', label: 'AOV', value: fmtNT(kpi.aov), delta: kpi.aovDelta, up: kpi.aovUp, onClick: () => navigate('/members/value-analysis') },
          { icon: MousePointerClick, bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'CVR', value: `${kpi.cvr}%`, delta: kpi.cvrDelta, up: kpi.cvrUp, onClick: () => navigate('/traffic/acquisition-quality') },
          { icon: Users, bg: 'bg-violet-50', color: 'text-violet-600', label: 'UU', value: kpi.uu.toLocaleString(), delta: kpi.uuDelta, up: kpi.uuUp },
          { icon: Package, bg: 'bg-rose-50', color: 'text-rose-500', label: '訂單數', value: kpi.orders.toLocaleString(), delta: kpi.ordersDelta, up: kpi.ordersUp },
        ].map(card => (
          <div
            key={card.label}
            className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden relative group ${card.onClick ? 'cursor-pointer' : ''}`}
            onClick={card.onClick}
          >
            <div className="absolute top-0 right-0 p-5 opacity-[0.04] group-hover:scale-110 transition-transform">
              <card.icon className="w-14 h-14" />
            </div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}><card.icon className="w-5 h-5" /></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight mb-1">{card.value}</p>
            {card.progress !== undefined && (
              <div className="mb-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${card.progress}%` }} />
              </div>
            )}
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-slate-400">vs 上期</span>
              <Delta up={card.up} val={card.delta} />
            </div>
          </div>
        ))}
      </div>

      {/* ── [C] 電商總覽資料表（Pivot Matrix） ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Table header bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">電商總覽資料表</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              指標列 × 時間欄 · 可拖拉指標列調整順序 · 左側指標欄固定
              <span className="ml-2 text-indigo-500 font-medium">
                {timePeriods.length} 個{timeUnit}區間
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-1 bg-slate-100 rounded-md font-medium">{rangeStart}</span>
            <span>→</span>
            <span className="px-2 py-1 bg-slate-100 rounded-md font-medium">{rangeEnd}</span>
          </div>
        </div>

        {/* Pivot table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: Math.max(600, 160 + timePeriods.length * 120) }}>
            {/* Time column headers */}
            <thead>
              <tr className="border-b border-slate-200">
                {/* Sticky metric-name header cell */}
                <th
                  className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider px-5 py-3.5 bg-slate-50 border-r border-slate-200 whitespace-nowrap"
                  style={{ position: 'sticky', left: 0, zIndex: 30, width: 160, minWidth: 160, backgroundColor: '#f8fafc' }}
                >
                  指標 / 時間
                </th>
                {periodData.map(p => (
                  <th
                    key={p.key}
                    className="text-center text-xs font-bold text-slate-500 px-3 py-3.5 bg-slate-50 whitespace-nowrap"
                    style={{ minWidth: 120 }}
                  >
                    {p.label}
                  </th>
                ))}
                {/* Summary column — sticky right */}
                <th
                  className="text-center text-xs font-bold text-indigo-600 px-3 py-3.5 whitespace-nowrap border-l border-indigo-200"
                  style={{ position: 'sticky', right: 0, zIndex: 30, minWidth: 120, backgroundColor: '#e0e7ff', boxShadow: '-4px 0 8px -2px rgba(99,102,241,0.08)' }}
                >
                  Total
                </th>
              </tr>
            </thead>

            {/* Metric rows */}
            <tbody>
              {activeMetricDefs.map((metric, rowIdx) => {
                const vals = periodData.map(p => (p as any)[metric.id] as number);
                const summaryVal = aggregateRows(rangeFiltered)[metric.id as keyof ReturnType<typeof aggregateRows>] as number;
                return (
                  <tr
                    key={metric.id}
                    draggable
                    onDragStart={(e) => handleRowDragStart(e, metric.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleRowDrop(e, metric.id)}
                    className={`group hover:bg-indigo-50/20 transition-colors ${rowIdx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'} border-b border-slate-100 last:border-0`}
                  >
                    {/* Sticky left: metric name */}
                    <td
                      className="px-5 py-3 border-r border-slate-200 whitespace-nowrap"
                      style={{
                        position: 'sticky', left: 0, zIndex: 20, width: 160, minWidth: 160,
                        backgroundColor: rowIdx % 2 === 1 ? '#f9fafb' : '#ffffff',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing flex-shrink-0 transition-opacity" />
                        <span className="text-sm font-semibold text-slate-700">{metric.label}</span>
                      </div>
                    </td>

                    {/* Value cells (one per period) */}
                    {vals.map((v, ci) => (
                      <td key={periodData[ci].key} className="px-3 py-3 text-center text-sm tabular-nums" style={{ minWidth: 120 }}>
                        <span className={metric.colorClass(v, vals)}>
                          {metric.fmt(v)}
                        </span>
                      </td>
                    ))}

                    {/* Summary cell — sticky right */}
                    <td
                      className="px-3 py-3 text-center text-sm tabular-nums border-l border-indigo-200"
                      style={{ position: 'sticky', right: 0, zIndex: 20, minWidth: 120, backgroundColor: rowIdx % 2 === 1 ? '#eef2ff' : '#f5f3ff', boxShadow: '-4px 0 8px -2px rgba(99,102,241,0.08)' }}
                    >
                      <span className={`font-bold ${metric.colorClass(summaryVal, [...vals, summaryVal])}`}>
                        {metric.fmt(summaryVal)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {activeMetricDefs.length === 0 && (
                <tr>
                  <td colSpan={timePeriods.length + 2} className="px-6 py-12 text-center text-sm text-slate-400">
                    請從上方「指標選擇」選擇要顯示的指標列
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── [D] Trend Chart (同步時間設定) ──────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">📈 趨勢分析</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {dateRangeType} · 粒度：{timeUnit}
              {totalOnlyMode && <> · 同期比較：{showComparison ? <span className="text-violet-600 font-semibold" title={XOX_FULL_LABELS[xoxType]}>{xoxType}</span> : <span>無</span>}</>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['gmv', 'netProfit', 'aov'] as const).map(key => (
                <button
                  key={key}
                  onClick={() => setTrendMetric(key)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${trendMetric === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {trendMeta[key].label}
                </button>
              ))}
            </div>
            {/* Series dropdown */}
            <div className="relative">
              <button
                onClick={() => setSeriesDropdownOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SERIES_COLORS[ALL_SERIES.filter(s => selectedSeries.includes(s))[0]] }} />
                {(() => {
                  const ordered = ALL_SERIES.filter(s => selectedSeries.includes(s));
                  if (ordered.length === ALL_SERIES.length) return 'All';
                  if (ordered.length <= 2) return ordered.join(' + ');
                  return `${ordered[0]} + ${ordered.length - 1}`;
                })()}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${seriesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {seriesDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSeriesDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                    {ALL_SERIES.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSeries(prev =>
                          prev.includes(s)
                            ? prev.length > 1 ? prev.filter(c => c !== s) : prev
                            : [...prev, s]
                        )}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border-2 flex items-center justify-center transition-colors"
                          style={selectedSeries.includes(s)
                            ? { background: SERIES_COLORS[s], borderColor: SERIES_COLORS[s] }
                            : { borderColor: '#cbd5e1' }
                          }
                        >
                          {selectedSeries.includes(s) && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="text-slate-700">{s}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Comparison toggle — only in Total-only mode */}
            {totalOnlyMode && (
              <button
                onClick={() => setShowComparison(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  showComparison
                    ? 'border-violet-300 bg-violet-50 text-violet-700 shadow-sm'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${showComparison ? 'border-violet-500 bg-violet-500' : 'border-slate-300 bg-white'}`}>
                  {showComparison && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                同期比較
              </button>
            )}
          </div>
        </div>

        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 52, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                interval={chartData.length > 20 ? Math.floor(chartData.length / 12) : 0}
              />
              <YAxis
                yAxisId="left" axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => trendMetric === 'aov' ? `${(v / 1000).toFixed(1)}k` : `${(v / 10000).toFixed(0)}萬`}
                width={48}
              />
              <YAxis
                yAxisId="right" orientation="right" axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip content={trendTooltip} />
              <Bar yAxisId="right" dataKey="uu" name="UU" fill="#e0e7ff" radius={[2, 2, 0, 0]} />
              {selectedSeries.includes('Total') && (
                <Line
                  yAxisId="left" dataKey="Total" name="Total"
                  stroke={SERIES_COLORS['Total']} strokeWidth={2.5} dot={false}
                  activeDot={{ r: 4, fill: SERIES_COLORS['Total'] }}
                />
              )}
              {totalOnlyMode && showComparison && (
                <Line
                  yAxisId="left" dataKey="prev" name={xoxType}
                  stroke={SERIES_COLORS['Total']} strokeWidth={1.5} strokeDasharray="5 4"
                  dot={false} activeDot={{ r: 3, fill: SERIES_COLORS['Total'] }} connectNulls
                />
              )}
              {(selectedSeries.filter(s => s !== 'Total') as ChannelName[]).map(ch => (
                <Line
                  key={ch} yAxisId="left" dataKey={ch} name={ch}
                  stroke={SERIES_COLORS[ch]} strokeWidth={2.5} dot={false}
                  activeDot={{ r: 4, fill: SERIES_COLORS[ch] }} connectNulls
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap gap-5 mt-3 justify-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-100" />UU</div>
          {ALL_SERIES.filter(s => selectedSeries.includes(s)).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 rounded" style={{ background: SERIES_COLORS[s] }} />
              {s === 'Total' ? trendMeta[trendMetric].label : s}
            </div>
          ))}
          {totalOnlyMode && showComparison && (
            <div className="flex items-center gap-1.5" title={XOX_FULL_LABELS[xoxType]}>
              <svg width="20" height="4" viewBox="0 0 20 4"><line x1="0" y1="2" x2="20" y2="2" stroke={SERIES_COLORS['Total']} strokeWidth="1.5" strokeDasharray="5 4" /></svg>
              {xoxType}
            </div>
          )}
        </div>
      </div>

      {/* ── [E+F] Funnel + Revenue Composition ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <div
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/traffic/ad-funnel')}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">🔽 轉換漏斗</h3>
              <p className="text-xs text-slate-400 mt-0.5">UU → 加購 → 結帳 → 完成</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
          </div>
          <div className="space-y-3">
            {funnelData.map((step, i) => {
              const pct = funnelData[0].value > 0 ? step.value / funnelData[0].value * 100 : 0;
              return (
                <div key={step.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">{step.name}</span>
                    <div className="flex items-center gap-3">
                      {step.rate !== null && <span className="text-indigo-600 font-bold">→ {step.rate}%</span>}
                      <span className="font-mono font-bold text-slate-800">{step.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg flex items-center pl-2.5 transition-all duration-700" style={{ width: `${pct}%`, background: funnelData[i].fill }}>
                      {pct > 22 && <span className="text-[10px] font-bold text-indigo-900/50">{pct.toFixed(1)}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-50 grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">整體 CVR</p>
              <p className="text-lg font-black text-indigo-700">{funnelData[0].value > 0 ? (funnelData[3].value / funnelData[0].value * 100).toFixed(2) : '0.00'}%</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">購物車放棄率</p>
              <p className="text-lg font-black text-rose-600">{funnelData[2].rate != null ? (100 - funnelData[2].rate).toFixed(1) : '—'}%</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">📡 渠道營收分布</h3>
                <p className="text-xs text-slate-400 mt-0.5">各渠道 GMV 貢獻</p>
              </div>
              <button onClick={() => navigate('/traffic/channel-performance')} className="text-xs text-indigo-600 font-bold flex items-center gap-0.5 hover:underline flex-shrink-0">
                詳情 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={channelDistribution} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v / 10000).toFixed(0)}萬`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={56} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
                        <p className="font-bold mb-1" style={{ color: d.color }}>{d.name}</p>
                        <p className="text-slate-600">GMV：<span className="font-mono font-bold">{fmtNT(d.gmv)}</span></p>
                        <p className="text-slate-400 mt-0.5">占比：{d.totalGmv > 0 ? (d.gmv / d.totalGmv * 100).toFixed(1) : '—'}%</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="gmv" name="GMV" radius={[0, 6, 6, 0]}>
                    {channelDistribution.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">👥 新舊客結構</h3>
                <p className="text-xs text-slate-400 mt-0.5">人數 vs GMV 佔比</p>
              </div>
              <button onClick={() => navigate('/members/new-member-conversion')} className="text-xs text-indigo-600 font-bold flex items-center gap-0.5 hover:underline flex-shrink-0">
                會員分析 <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[80px_1fr_1fr_100px] mb-2">
              <div />
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">人數佔比</div>
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">GMV佔比</div>
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">人均GMV</div>
            </div>

            {/* Data rows */}
            {(() => {
              const maxGmvPerUser  = Math.max(...nvrData.map(r => r.人均GMV));
              const totalUsers     = nvrData.reduce((s, r) => s + (r.人均GMV > 0 ? 1 : 0), 0); // proxy check
              const totalUuAll     = rangeFiltered.reduce((s, r) => s + r.uu,  0);
              const totalGmvAll    = rangeFiltered.reduce((s, r) => s + r.gmv, 0);
              const avgGMVPerUser  = totalUuAll > 0 ? totalGmvAll / totalUuAll : 0;
              return nvrData.map((row, _idx) => {
                const color    = row.name === '新客' ? '#6366f1' : '#10b981';
                const gradient = `linear-gradient(90deg, ${color}99, ${color})`;
                const isHigher = row.人均GMV === maxGmvPerUser;
                const diffPct: number | null = (totalUuAll > 0 && avgGMVPerUser > 0 && row.人均GMV > 0)
                  ? Math.round((row.人均GMV - avgGMVPerUser) / avgGMVPerUser * 100)
                  : null;
                void totalUsers; // suppress unused warning
                return (
                  <div key={row.name} className="grid grid-cols-[80px_1fr_1fr_100px] items-center py-3 border-t border-slate-100">
                    {/* Row label */}
                    <div className="flex items-center gap-2 pr-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{row.name}</span>
                    </div>
                    {/* 人數佔比 cell — [thick bar] number */}
                    <div className="px-3 border-l border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                          <div className="h-full rounded-r-lg" style={{ width: `${row.人數佔比}%`, background: gradient }} />
                        </div>
                        <span className="text-sm font-black tabular-nums w-9 text-right shrink-0" style={{ color }}>{row.人數佔比}%</span>
                      </div>
                    </div>
                    {/* GMV佔比 cell — [thick bar] number */}
                    <div className="px-3 border-l border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                          <div className="h-full rounded-r-lg" style={{ width: `${row.GMV佔比}%`, background: gradient }} />
                        </div>
                        <span className="text-sm font-black tabular-nums w-9 text-right shrink-0" style={{ color }}>{row.GMV佔比}%</span>
                      </div>
                    </div>
                    {/* 人均GMV cell — number only, higher = stronger color */}
                    <div className="px-3 border-l border-slate-100 text-right">
                      <span className={`text-sm font-black tabular-nums ${isHigher ? 'text-emerald-600' : 'text-slate-500'}`}>
                        NT${row.人均GMV.toLocaleString()}
                      </span>
                      {diffPct !== null && diffPct > 0 && (
                        <div className="text-[10px] font-bold text-emerald-500 mt-0.5">
                          ↑ +{diffPct}%
                        </div>
                      )}
                      {diffPct !== null && diffPct < 0 && (
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                          ↓ {diffPct}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
            <div className="mt-3 text-right">
              <span className="text-xs text-slate-400">* 人均GMV差異為相對整體平均</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── [G] Profit & Cost ───────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-base font-bold text-slate-800 mb-1">💰 獲利與成本</h3>
        <p className="text-xs text-slate-400 mb-5">GMV → 毛利 → 淨獲利 · Co幣成本分析</p>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { label: 'GMV',   value: fmtNT(kpi.gmv),   sub: null,                    bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
            { label: '毛利',  value: fmtNT(Math.round(kpi.gmv * kpi.grossMargin / 100)), sub: `${kpi.grossMargin}%`, bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
            { label: '淨獲利',value: fmtNT(kpi.netProfit), sub: `${(kpi.netProfit / kpi.gmv * 100).toFixed(1)}%`, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
          ].flatMap((item, idx, arr) => [
            <div key={item.label} className={`flex-1 min-w-[110px] px-4 py-3 rounded-xl border ${item.bg} ${item.border}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <p className={`text-base font-black ${item.text}`}>{item.value}</p>
              {item.sub && <p className={`text-xs font-bold ${item.text} opacity-70 mt-0.5`}>{item.sub}</p>}
            </div>,
            idx < arr.length - 1 ? <ChevronsRight key={`ar-${idx}`} className="w-5 h-5 text-slate-300 flex-shrink-0" /> : null,
          ])}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '毛利率',     value: `${kpi.grossMargin}%`,                                      delta: kpi.marginDelta,              up: kpi.marginUp,              sub: null,                                                color: 'text-violet-600' },
            { label: '淨利率',     value: `${coinsMetrics.netProfitRate.toFixed(1)}%`,               delta: coinsMetrics.npRateDelta,      up: coinsMetrics.npRateUp,      sub: null,                                                color: 'text-emerald-600' },
            { label: 'Co幣 Burn',  value: `${coinsMetrics.burnRate.toFixed(1)}%`,                   delta: coinsMetrics.burnDelta,        up: coinsMetrics.burnUp,        sub: `${fmtNT(Math.round(coinsMetrics.burnAmount))} 沖銷`, color: 'text-amber-600' },
            { label: 'Co幣滲透率', value: `${coinsMetrics.penetration.toFixed(1)}%`,                delta: coinsMetrics.penDelta,         up: coinsMetrics.penUp,         sub: '使用Co幣訂單占比',                                  color: 'text-sky-600' },
          ].map(m => (
            <div key={m.label} className="bg-slate-50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{m.label}</p>
              <p className={`text-xl font-black ${m.color} mb-1`}>{m.value}</p>
              {m.sub && <p className="text-[10px] text-slate-400 mb-2">{m.sub}</p>}
              <Delta up={m.up} val={m.delta} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
