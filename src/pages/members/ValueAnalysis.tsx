import { useState, useMemo } from 'react';
import { Users, Star, DollarSign, TrendingUp, ChevronRight, X, User } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface DrawerMember {
  id: string;
  tier: string;
  totalSpent: number;
  orderCount: number;
  aov: number;
}

// ─────────────────────────────────────────────
// Constants & Mock Data
// ─────────────────────────────────────────────
const TIERS = ['一般', '銅', '銀', '金', '鑽石'];

const TIER_COLORS: Record<string, string> = {
  '鑽石': '#7c3aed',
  '金': '#d97706',
  '銀': '#94a3b8',
  '銅': '#b45309',
  '一般': '#6366f1',
};

const tierData = [
  { name: '鑽石', count: 420 },
  { name: '金', count: 1280 },
  { name: '銀', count: 2640 },
  { name: '銅', count: 3850 },
  { name: '一般', count: 5210 },
];
const totalMembers = tierData.reduce((s, d) => s + d.count, 0);

const bubbleData = [
  { x: 1, y: 800, z: 2100, label: '低頻低值', avgSpent: 800, avgAOV: 800, avgPurchases: 1 },
  { x: 1, y: 2400, z: 850, label: '低頻中值', avgSpent: 2400, avgAOV: 2400, avgPurchases: 1 },
  { x: 2, y: 1800, z: 1500, label: '中頻低值', avgSpent: 1800, avgAOV: 900, avgPurchases: 2 },
  { x: 3, y: 5500, z: 1200, label: '中頻中值', avgSpent: 5500, avgAOV: 1833, avgPurchases: 3 },
  { x: 4, y: 9200, z: 720, label: '中頻高值', avgSpent: 9200, avgAOV: 2300, avgPurchases: 4 },
  { x: 6, y: 14000, z: 480, label: '高頻中值', avgSpent: 14000, avgAOV: 2333, avgPurchases: 6 },
  { x: 8, y: 22000, z: 380, label: '高頻高值', avgSpent: 22000, avgAOV: 2750, avgPurchases: 8 },
  { x: 12, y: 38000, z: 210, label: '超高頻', avgSpent: 38000, avgAOV: 3167, avgPurchases: 12 },
  { x: 16, y: 58000, z: 80, label: '頂級高值', avgSpent: 58000, avgAOV: 3625, avgPurchases: 16 },
];

const histogramData = [
  { range: '0–1,000', count: 2100, pct: '16.0%' },
  { range: '1k–5k', count: 4350, pct: '33.1%' },
  { range: '5k–10k', count: 3200, pct: '24.4%' },
  { range: '10k–20k', count: 1950, pct: '14.9%' },
  { range: '20k+', count: 1500, pct: '11.4%' },
];

const segmentData = [
  { name: '低價值', threshold: '< $5,000', memberCount: 6450, revenue: 8200000, fill: '#c7d2fe' },
  { name: '中價值', threshold: '$5k–$20k', memberCount: 4650, revenue: 38700000, fill: '#818cf8' },
  { name: '高價值', threshold: '> $20,000', memberCount: 2300, revenue: 89500000, fill: '#4f46e5' },
];

const boxPlotRawData = [
  { tier: '一般', min: 200, q1: 800, median: 2100, q3: 5000, max: 8500, outliers: [] as number[] },
  { tier: '銅', min: 800, q1: 2500, median: 5200, q3: 9800, max: 15000, outliers: [] as number[] },
  { tier: '銀', min: 2000, q1: 5500, median: 9800, q3: 16000, max: 24000, outliers: [28000] },
  { tier: '金', min: 5500, q1: 12000, median: 21000, q3: 34000, max: 48000, outliers: [55000] },
  { tier: '鑽石', min: 18000, q1: 28000, median: 42000, q3: 62000, max: 80000, outliers: [95000] },
];

const BOX_COLORS: Record<string, string> = {
  '一般': '#6366f1',
  '銅': '#b45309',
  '銀': '#94a3b8',
  '金': '#d97706',
  '鑽石': '#7c3aed',
};

const mockDrawerMembers: DrawerMember[] = Array.from({ length: 8 }, (_, i) => ({
  id: `M${10001 + i}`,
  tier: TIERS[i % TIERS.length],
  totalSpent: (i + 1) * 6500,
  orderCount: (i % 6) + 1,
  aov: Math.floor(((i + 1) * 6500) / ((i % 6) + 1)),
}));

// ─────────────────────────────────────────────
// Donut center label
// Must be a STABLE FUNCTION at module level — not an inline component
// inside render — so Recharts always receives the same reference.
// ─────────────────────────────────────────────
function DonutCenterLabel({ viewBox }: any) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1e293b" fontSize="22" fontWeight="800">
        {totalMembers.toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="500">
        總會員數
      </text>
    </g>
  );
}

// ─────────────────────────────────────────────
// ChartCard — consistent wrapper with guaranteed height
// ─────────────────────────────────────────────
function ChartCard({ title, subtitle, height = 280, children }: {
  title: string;
  subtitle?: string;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {/* Explicit pixel height guarantees ResponsiveContainer gets a valid size */}
      <div style={{ height }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Member Drilldown Drawer
// ─────────────────────────────────────────────
function MemberDrawer({
  isOpen, onClose, title, members,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  members: DrawerMember[];
}) {
  if (!isOpen) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[1000] animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[1001] flex flex-col animate-in slide-in-from-right duration-400 ease-out">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">共 {members.length} 位會員（示範）</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-3">
          {members.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">查無符合會員</div>
          ) : members.map(m => (
            <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <User className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{m.id}</p>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: (TIER_COLORS[m.tier] ?? '#6366f1') + '20', color: TIER_COLORS[m.tier] ?? '#6366f1' }}
                  >
                    {m.tier}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">累積消費</p>
                  <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">${m.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">購買次數</p>
                  <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{m.orderCount} 次</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">客單價</p>
                  <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">${m.aov.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm">
            匯出此名單 (CSV)
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Box Plot (custom SVG — Recharts has no BoxPlot)
// ─────────────────────────────────────────────
function BoxPlotChart() {
  const [tooltipData, setTooltipData] = useState<typeof boxPlotRawData[0] | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const SVG_H = 260;
  const SVG_W = 560;
  const PAD_L = 56;
  const PAD_B = 32;
  const PAD_T = 12;
  const drawH = SVG_H - PAD_B - PAD_T;
  const colW = (SVG_W - PAD_L) / boxPlotRawData.length;
  const maxVal = 100000;

  const toY = (v: number) => PAD_T + drawH * (1 - v / maxVal);
  const yTicks = [0, 20000, 40000, 60000, 80000, 100000];

  return (
    <div className="relative w-full" style={{ height: SVG_H }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-full"
        onMouseLeave={() => setTooltipData(null)}
      >
        {yTicks.map(t => (
          <g key={t}>
            <line x1={PAD_L} y1={toY(t)} x2={SVG_W} y2={toY(t)} stroke="#f1f5f9" strokeWidth={1} />
            <text x={PAD_L - 6} y={toY(t) + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
              {t === 0 ? '0' : `${t / 10000}w`}
            </text>
          </g>
        ))}

        {boxPlotRawData.map((d, i) => {
          const cx = PAD_L + colW * i + colW / 2;
          const bw = colW * 0.40;
          const yMin = toY(d.min);
          const yQ1 = toY(d.q1);
          const yMed = toY(d.median);
          const yQ3 = toY(d.q3);
          const yMax = toY(d.max);
          const col = BOX_COLORS[d.tier] ?? '#6366f1';

          return (
            <g
              key={d.tier}
              onMouseMove={e => {
                const rect = (e.currentTarget as SVGElement).closest('svg')!.getBoundingClientRect();
                setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                setTooltipData(d);
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* Whisker lines */}
              <line x1={cx} y1={yMin} x2={cx} y2={yQ1} stroke={col} strokeWidth={1.5} strokeDasharray="3,2" opacity={0.5} />
              <line x1={cx} y1={yQ3} x2={cx} y2={yMax} stroke={col} strokeWidth={1.5} strokeDasharray="3,2" opacity={0.5} />
              {/* Whisker caps */}
              <line x1={cx - bw * 0.4} y1={yMin} x2={cx + bw * 0.4} y2={yMin} stroke={col} strokeWidth={1.5} opacity={0.5} />
              <line x1={cx - bw * 0.4} y1={yMax} x2={cx + bw * 0.4} y2={yMax} stroke={col} strokeWidth={1.5} opacity={0.5} />
              {/* IQR box fill */}
              <rect x={cx - bw / 2} y={yQ3} width={bw} height={yQ1 - yQ3} fill={col} opacity={0.12} rx={3} />
              {/* IQR box border */}
              <rect x={cx - bw / 2} y={yQ3} width={bw} height={yQ1 - yQ3} fill="none" stroke={col} strokeWidth={1.5} rx={3} />
              {/* Median line */}
              <line x1={cx - bw / 2} y1={yMed} x2={cx + bw / 2} y2={yMed} stroke={col} strokeWidth={2.5} />
              {/* Outliers */}
              {d.outliers.map((o, oi) => (
                <circle key={oi} cx={cx} cy={toY(o)} r={3} fill="none" stroke={col} strokeWidth={1.5} opacity={0.7} />
              ))}
              {/* X-axis label */}
              <text x={cx} y={SVG_H - 6} textAnchor="middle" fontSize={11} fill="#475569" fontWeight={600}>{d.tier}</text>
            </g>
          );
        })}
      </svg>

      {tooltipData && (
        <div
          className="absolute pointer-events-none bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-xs z-50"
          style={{
            top: Math.max(0, tooltipPos.y - 130),
            left: Math.min(tooltipPos.x + 12, SVG_W - 180),
          }}
        >
          <p className="font-bold text-slate-900 mb-2">{tooltipData.tier} 累積消費分布</p>
          <div className="space-y-1 text-slate-600">
            <p>最大值：<span className="font-mono font-bold">${tooltipData.max.toLocaleString()}</span></p>
            <p>Q3：<span className="font-mono font-bold">${tooltipData.q3.toLocaleString()}</span></p>
            <p className="text-indigo-600 font-bold">中位數：${tooltipData.median.toLocaleString()}</p>
            <p>Q1：<span className="font-mono font-bold">${tooltipData.q1.toLocaleString()}</span></p>
            <p>最小值：<span className="font-mono font-bold">${tooltipData.min.toLocaleString()}</span></p>
            {tooltipData.outliers.length > 0 && (
              <p className="text-rose-500">離群值：${tooltipData.outliers[0].toLocaleString()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ValueAnalysis() {
  const [dateRangeType, setDateRangeType] = useState('最近30天');
  const [customStart, setCustomStart] = useState('2026-02-01');
  const [customEnd, setCustomEnd] = useState('2026-03-13');
  const [selectedDimensionsMap, setSelectedDimensionsMap] = useState<Record<string, string[]>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerMembers, setDrawerMembers] = useState<DrawerMember[]>([]);

  const openDrawer = (title: string, filterFn: (m: DrawerMember) => boolean = () => true) => {
    setDrawerTitle(title);
    setDrawerMembers(mockDrawerMembers.filter(filterFn));
    setDrawerOpen(true);
  };

  const kpis = useMemo(() => [
    { title: '總會員數', value: totalMembers.toLocaleString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+3.2%', up: true },
    { title: '高價值會員數', value: '2,300', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+8.5%', up: true },
    { title: '平均累積消費金額', value: '$10,480', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+4.1%', up: true },
    { title: '平均客單價', value: '$2,140', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', trend: '+1.8%', up: true },
  ], []);

  // ── Tooltip renderers ──────────────────────
  const tierTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const pct = ((d.count / totalMembers) * 100).toFixed(1);
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold mb-1" style={{ color: TIER_COLORS[d.name] }}>{d.name}</p>
        <p className="text-slate-600">會員數：<span className="font-mono font-bold">{d.count.toLocaleString()}</span></p>
        <p className="text-slate-600">佔比：<span className="font-mono font-bold">{pct}%</span></p>
      </div>
    );
  };

  const bubbleTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold text-slate-900 mb-2">{d.label}</p>
        <p className="text-slate-600">會員數：<span className="font-mono font-bold">{d.z.toLocaleString()}</span></p>
        <p className="text-slate-600">平均累積消費：<span className="font-mono font-bold">${d.avgSpent.toLocaleString()}</span></p>
        <p className="text-slate-600">平均客單價：<span className="font-mono font-bold">${d.avgAOV.toLocaleString()}</span></p>
        <p className="text-slate-600">平均購買次數：<span className="font-mono font-bold">{d.avgPurchases} 次</span></p>
      </div>
    );
  };

  const histTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold text-slate-900 mb-1">消費區間：{d.range}</p>
        <p className="text-slate-600">會員數：<span className="font-mono font-bold">{d.count.toLocaleString()}</span></p>
        <p className="text-slate-600">佔比：<span className="font-mono font-bold">{d.pct}</span></p>
      </div>
    );
  };

  const segTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold text-slate-900 mb-1">{d.name}</p>
        <p className="text-slate-400 text-[10px] mb-1">門檻：{d.threshold}</p>
        <p className="text-slate-600">會員數：<span className="font-mono font-bold">{d.memberCount.toLocaleString()}</span></p>
        <p className="text-slate-600">營收貢獻：<span className="font-mono font-bold">${(d.revenue / 1000000).toFixed(1)}M</span></p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">會員價值分析</h1>
        <p className="mt-1 text-sm text-slate-500">
          分析會員階級結構、消費金額分布與高低值會員的營收貢獻，了解會員價值組成。
        </p>
      </div>

      {/* Control Bar */}
      <AnalyticsControlBar
        showMetricSelector={false}
        dimensionFields={[
          { id: 'tier', label: '會員階級', options: TIERS.map(t => ({ id: t, label: t })) },
          { id: 'gender', label: '性別', options: [{ id: 'female', label: '女性' }, { id: 'male', label: '男性' }] },
        ]}
        selectedDimensionsMap={selectedDimensionsMap}
        onDimensionsMapChange={setSelectedDimensionsMap}
        hideTimeGranularity={true}
        singleRowLayout={true}
        dateRangeType={dateRangeType}
        onDateRangeTypeChange={setDateRangeType}
        customStart={customStart}
        onCustomStartChange={setCustomStart}
        customEnd={customEnd}
        onCustomEndChange={setCustomEnd}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => (
          <div key={kpi.title} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative group">
            <div className={`absolute top-0 right-0 p-6 opacity-[0.04] group-hover:scale-110 transition-transform ${kpi.color}`}>
              <kpi.icon className="w-16 h-16" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.title}</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-black text-slate-900 tracking-tight">{kpi.value}</div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Donut + Bubble ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. 會員階級分布 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-4">🥧 會員階級分布</h3>
          <div className="flex gap-4 items-center">
            {/* Explicit height on parent div — required by ResponsiveContainer */}
            <div className="flex-1" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={2}
                    onClick={d => openDrawer(`${d.name} 會員名單`, m => m.tier === d.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {tierData.map(entry => (
                      <Cell key={entry.name} fill={TIER_COLORS[entry.name]} />
                    ))}
                    {/*
                      Use Recharts <Label> with content prop — the ONLY correct way
                      to render a center label in a donut chart. Direct child components
                      like <DonutCenter /> are not processed by Recharts and will crash.
                    */}
                    <Label content={<DonutCenterLabel />} position="center" />
                  </Pie>
                  <Tooltip content={tierTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-36 shrink-0 space-y-1.5">
              {tierData.map(d => (
                <button
                  key={d.name}
                  onClick={() => openDrawer(`${d.name} 會員名單`, m => m.tier === d.name)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TIER_COLORS[d.name] }} />
                    <span className="text-xs font-bold text-slate-700">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-slate-900">{d.count.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">{((d.count / totalMembers) * 100).toFixed(1)}%</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. 會員價值地圖 */}
        <ChartCard
          title="🗺️ 會員價值地圖"
          subtitle="X軸：購買次數 / Y軸：累積消費金額 / 泡泡大小：會員數"
          height={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 20, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="x" type="number" name="購買次數"
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: '購買次數', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                dataKey="y" type="number" name="累積消費"
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={v => v >= 10000 ? `${v / 10000}w` : `${v}`}
              />
              <ZAxis dataKey="z" range={[60, 600]} name="會員數" />
              <Tooltip content={bubbleTooltip} />
              <Scatter
                data={bubbleData}
                fill="#6366f1"
                fillOpacity={0.55}
                onClick={(d: any) => openDrawer(`${d.label} 會員名單`)}
                style={{ cursor: 'pointer' }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 2: Histogram ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-base font-bold text-slate-800 mb-1">📊 會員消費金額分布圖</h3>
        <p className="text-xs text-slate-400 mb-4">點擊柱子查看對應會員名單</p>
        {/* Explicit pixel height */}
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={histogramData}
              margin={{ top: 8, right: 20, bottom: 8, left: 8 }}
              onClick={(state: any) => {
                const payload = state?.activePayload?.[0]?.payload;
                if (payload) openDrawer(`消費 ${payload.range} 會員名單`);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={histTooltip} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" name="會員數" radius={[6, 6, 0, 0]} cursor="pointer">
                {histogramData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${240 - i * 10}, ${60 + i * 3}%, ${65 - i * 4}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3: Segment Bar + Box Plot ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 4. 會員價值區間分析 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">📈 會員價值區間分析</h3>
          <p className="text-xs text-slate-400 mb-4">按累積消費金額分群，比較各群會員數與營收貢獻</p>
          {/* Explicit pixel height */}
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={segmentData}
                margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
                onClick={(state: any) => {
                  const payload = state?.activePayload?.[0]?.payload;
                  if (payload) openDrawer(`${payload.name}會員名單`);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip content={segTooltip} cursor={{ fill: '#f8fafc' }} />
                <Bar yAxisId="left" dataKey="memberCount" name="會員數" radius={[6, 6, 0, 0]} cursor="pointer">
                  {segmentData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
                <Bar yAxisId="right" dataKey="revenue" name="營收貢獻" radius={[6, 6, 0, 0]} cursor="pointer" fill="#1e40af" opacity={0.65} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Summary cards */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {segmentData.map(s => (
              <button
                key={s.name}
                onClick={() => openDrawer(`${s.name}會員名單`)}
                className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-5 rounded-full shrink-0" style={{ background: s.fill }} />
                  <span className="text-[10px] font-bold text-slate-600 leading-tight">{s.name}</span>
                </div>
                <p className="text-sm font-black text-slate-900">{s.memberCount.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">${(s.revenue / 1000000).toFixed(1)}M 營收</p>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 mt-1 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* 5. 會員價值箱型圖 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">📦 會員價值箱型圖</h3>
          <p className="text-xs text-slate-400 mb-4">各會員階級的累積消費金額分布（中位數、四分位距、極值）</p>
          <BoxPlotChart />
          <div className="mt-3 flex gap-3 flex-wrap">
            {boxPlotRawData.map(d => (
              <div key={d.tier} className="flex items-center gap-1.5 text-xs text-slate-600">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: (BOX_COLORS[d.tier] ?? '#6366f1') + '40', border: `1.5px solid ${BOX_COLORS[d.tier] ?? '#6366f1'}` }}
                />
                <span className="font-medium">{d.tier}</span>
                <span className="text-slate-400 font-mono text-[10px]">中位 ${(d.median / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MemberDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        members={drawerMembers}
      />
    </div>
  );
}
