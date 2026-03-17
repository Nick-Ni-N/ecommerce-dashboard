import { useState, useMemo } from 'react';
import { RefreshCw, Clock, UserX, AlertTriangle, X, User } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Label,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface DrawerMember {
  id: string;
  tier: string;
  dormantDays: number;
  totalSpent: number;
  orderCount: number;
  churnRisk: '綠燈' | '黃燈' | '紅燈' | 'New';
  lastPurchase: string;
}

// ─────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────
const TIERS = ['一般', '銅', '銀', '金', '鑽石'];
const CHURN: DrawerMember['churnRisk'][] = ['New', '綠燈', '黃燈', '紅燈'];

const mockMembers: DrawerMember[] = Array.from({ length: 40 }, (_, i) => ({
  id: `M${10001 + i}`,
  tier: TIERS[i % TIERS.length],
  dormantDays: [3, 12, 22, 45, 75, 110, 200][i % 7],
  totalSpent: (i + 1) * 3800,
  orderCount: (i % 8) + 1,
  churnRisk: CHURN[i % 4],
  lastPurchase: `2026-0${(i % 3) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
}));

// Chart 1 — 回購週期分布
const repurchaseHistData = [
  { range: '0–7天', count: 520 },
  { range: '7–14天', count: 840 },
  { range: '14–30天', count: 1650 },
  { range: '30–60天', count: 2100 },
  { range: '60–90天', count: 980 },
  { range: '90天+', count: 410 },
];

// Chart 2 — 流失預警分布
const churnDonutData = [
  { name: 'New', count: 1840, color: '#6366f1' },
  { name: '綠燈', count: 5620, color: '#10b981' },
  { name: '黃燈', count: 2380, color: '#f59e0b' },
  { name: '紅燈', count: 1160, color: '#ef4444' },
];
const totalChurn = churnDonutData.reduce((s, d) => s + d.count, 0);

// Chart 3 — 休眠天數分布
const dormancyHistData = [
  { range: '0–7天', count: 3200 },
  { range: '7–30天', count: 2800 },
  { range: '30–60天', count: 1600 },
  { range: '60–90天', count: 780 },
  { range: '90–180天', count: 490 },
  { range: '180天+', count: 230 },
];

// Chart 4 — 購買次數 vs 休眠天數 Bubble
const activityBubbleData = [
  { x: 1, y: 120, z: 1800, label: '新會員', desc: '首購後未回購' },
  { x: 1, y: 55, z: 950, label: '單次活躍', desc: '最近有購買' },
  { x: 2, y: 45, z: 1400, label: '初期回購', desc: '回購初期' },
  { x: 3, y: 30, z: 1100, label: '穩定回購', desc: '健康回購週期' },
  { x: 5, y: 20, z: 820, label: '高頻活躍', desc: '核心活躍會員' },
  { x: 8, y: 15, z: 540, label: '超高頻', desc: '忠誠會員' },
  { x: 2, y: 150, z: 680, label: '流失風險', desc: '回購後停止' },
  { x: 1, y: 240, z: 420, label: '流失會員', desc: '長期未回購' },
  { x: 4, y: 90, z: 310, label: '中期流失', desc: '多次購買後流失' },
];

// ─────────────────────────────────────────────
// Cohort Data (Heatmap)
// ─────────────────────────────────────────────
// null = 尚未滿足天數條件（灰色顯示）
const cohortByMonth: { row: string; d30: number | null; d60: number | null; d90: number | null; total: number }[] = [
  { row: '2025-07', d30: 38.2, d60: 52.1, d90: 61.3, total: 842 },
  { row: '2025-08', d30: 41.5, d60: 55.8, d90: 63.7, total: 910 },
  { row: '2025-09', d30: 36.8, d60: 49.2, d90: 58.4, total: 780 },
  { row: '2025-10', d30: 44.1, d60: 57.3, d90: 65.2, total: 1050 },
  { row: '2025-11', d30: 39.6, d60: 53.0, d90: 61.9, total: 920 },
  { row: '2025-12', d30: 48.3, d60: 61.2, d90: 68.5, total: 1340 },
  { row: '2026-01', d30: 42.7, d60: 56.4, d90: null, total: 1120 },
  { row: '2026-02', d30: 45.2, d60: null, d90: null, total: 980 },
  { row: '2026-03', d30: null, d60: null, d90: null, total: 560 },
];

const cohortByProduct: { row: string; d30: number | null; d60: number | null; d90: number | null; total: number }[] = [
  { row: '魚油', d30: 48.3, d60: 62.1, d90: 71.4, total: 1980 },
  { row: '苦瓜胜肽', d30: 42.7, d60: 55.8, d90: 64.3, total: 1540 },
  { row: '大餐包', d30: 56.1, d60: 69.4, d90: 76.8, total: 2310 },
  { row: '益生菌', d30: 61.5, d60: 74.2, d90: 81.3, total: 2750 },
  { row: '膠原蛋白', d30: 44.9, d60: 58.6, d90: 67.2, total: 1820 },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function heatmapColor(val: number | null): string {
  if (val === null) return '#f1f5f9';
  if (val >= 65) return '#1d4ed8';
  if (val >= 55) return '#3b82f6';
  if (val >= 45) return '#60a5fa';
  if (val >= 35) return '#93c5fd';
  return '#bfdbfe';
}

function heatmapTextColor(val: number | null): string {
  if (val === null) return '#94a3b8';
  return val >= 55 ? '#fff' : '#1e3a8a';
}

// ─────────────────────────────────────────────
// Donut center label (module-level stable reference)
// ─────────────────────────────────────────────
function ChurnDonutCenter({ viewBox }: any) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1e293b" fontSize="20" fontWeight="800">
        {totalChurn.toLocaleString()}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">
        總會員數
      </text>
    </g>
  );
}

// ─────────────────────────────────────────────
// Drilldown Drawer
// ─────────────────────────────────────────────
const CHURN_STYLE: Record<string, { bg: string; text: string }> = {
  'New': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  '綠燈': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  '黃燈': { bg: 'bg-amber-50', text: 'text-amber-600' },
  '紅燈': { bg: 'bg-rose-50', text: 'text-rose-600' },
};

function MemberDrawer({ isOpen, onClose, title, members }: {
  isOpen: boolean; onClose: () => void; title: string; members: DrawerMember[];
}) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[1000]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[1001] flex flex-col animate-in slide-in-from-right duration-400">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">共 {members.length} 位會員</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-3">
          {members.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">查無符合會員</div>
          ) : members.map(m => {
            const cs = CHURN_STYLE[m.churnRisk] ?? CHURN_STYLE['New'];
            return (
              <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.id}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      <span className="text-[10px] bg-indigo-50/80 text-indigo-600 px-1.5 py-0.5 rounded font-bold">{m.tier}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${cs.bg} ${cs.text}`}>{m.churnRisk}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">休眠天數</p>
                    <p className={`text-sm font-mono font-bold mt-0.5 ${m.dormantDays > 90 ? 'text-rose-500' : m.dormantDays > 30 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {m.dormantDays}天
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">購買次數</p>
                    <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{m.orderCount}次</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">累積消費</p>
                    <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">${m.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
            匯出此名單 (CSV)
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Retention Heatmap Component
// ─────────────────────────────────────────────
function RetentionHeatmap({ title, subtitle, rows, onCellClick }: {
  title: string;
  subtitle?: string;
  rows: { row: string; d30: number | null; d60: number | null; d90: number | null; total: number }[];
  onCellClick: (row: string, period: string, val: number | null) => void;
}) {
  const cols: { key: 'd30' | 'd60' | 'd90'; label: string }[] = [
    { key: 'd30', label: '30天回購率' },
    { key: 'd60', label: '60天回購率' },
    { key: 'd90', label: '90天回購率' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 text-slate-500 font-semibold w-28">首購條件</th>
              <th className="text-center py-2 px-2 text-slate-500 font-semibold w-20">首購人數</th>
              {cols.map(c => (
                <th key={c.key} className="text-center py-2 px-2 text-slate-500 font-semibold min-w-[80px]">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.row} className="border-t border-slate-50">
                <td className="py-2 pr-4 font-bold text-slate-700 text-xs">{r.row}</td>
                <td className="py-2 px-2 text-center text-slate-500 font-mono">{r.total.toLocaleString()}</td>
                {cols.map(c => {
                  const val = r[c.key];
                  return (
                    <td key={c.key} className="py-1 px-1">
                      <button
                        onClick={() => onCellClick(r.row, c.label, val)}
                        disabled={val === null}
                        className={`w-full py-2 px-1 rounded-lg text-xs font-bold transition-all ${val !== null ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
                          }`}
                        style={{
                          background: heatmapColor(val),
                          color: heatmapTextColor(val),
                        }}
                      >
                        {val !== null ? `${val.toFixed(1)}%` : '—'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {/* Color legend */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[10px] text-slate-400">回購率</span>
          {[
            { label: '< 35%', bg: '#bfdbfe', text: '#1e3a8a' },
            { label: '35–45%', bg: '#93c5fd', text: '#1e3a8a' },
            { label: '45–55%', bg: '#60a5fa', text: '#1e3a8a' },
            { label: '55–65%', bg: '#3b82f6', text: '#fff' },
            { label: '≥ 65%', bg: '#1d4ed8', text: '#fff' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ background: l.bg }} />
              <span className="text-[10px] text-slate-500">{l.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <div className="w-4 h-4 rounded bg-slate-100" />
            <span className="text-[10px] text-slate-400">尚未滿足天數</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function RetentionChurn() {
  const [dateRangeType, setDateRangeType] = useState('最近30天');
  const [customStart, setCustomStart] = useState('2026-02-01');
  const [customEnd, setCustomEnd] = useState('2026-03-13');
  const [selectedDimensionsMap, setSelectedDimensionsMap] = useState<Record<string, string[]>>({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerMembers, setDrawerMembers] = useState<DrawerMember[]>([]);

  const openDrawer = (title: string, filter: (m: DrawerMember) => boolean = () => true) => {
    setDrawerTitle(title);
    setDrawerMembers(mockMembers.filter(filter));
    setDrawerOpen(true);
  };

  // KPIs (respond to filters in real implementation)
  const kpis = useMemo(() => [
    {
      title: '平均回購天數', value: '38.5 天',
      sub: '所有會員平均回購間隔', icon: RefreshCw,
      color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '-2.1天', up: true
    },
    {
      title: '最近回購天數', value: '24.2 天',
      sub: '最近一次回購間隔平均', icon: Clock,
      color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '-3.5天', up: true
    },
    {
      title: '流失會員數', value: '1,160',
      sub: '流失預警為「紅燈」', icon: UserX,
      color: 'text-rose-600', bg: 'bg-rose-50', trend: '+84', up: false
    },
    {
      title: '即將流失會員數', value: '2,380',
      sub: '流失預警為「黃燈」', icon: AlertTriangle,
      color: 'text-amber-600', bg: 'bg-amber-50', trend: '+142', up: false
    },
  ], []);

  // Custom tooltips
  const histTooltip = (labelKey: string) => ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold text-slate-900 mb-1">{labelKey}：{d.range}</p>
        <p className="text-slate-600">會員數：<span className="font-mono font-bold">{d.count.toLocaleString()}</span></p>
      </div>
    );
  };

  const churnTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold mb-1" style={{ color: d.color }}>{d.name}</p>
        <p className="text-slate-600">會員數：<span className="font-mono font-bold">{d.count.toLocaleString()}</span></p>
        <p className="text-slate-600">佔比：<span className="font-mono font-bold">{((d.count / totalChurn) * 100).toFixed(1)}%</span></p>
      </div>
    );
  };

  const bubbleTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold text-slate-900 mb-1">{d.label}</p>
        <p className="text-slate-500 mb-2 text-[10px]">{d.desc}</p>
        <p className="text-slate-600">購買次數：<span className="font-mono font-bold">{d.x} 次</span></p>
        <p className="text-slate-600">平均休眠天數：<span className="font-mono font-bold">{d.y} 天</span></p>
        <p className="text-slate-600">會員數：<span className="font-mono font-bold">{d.z.toLocaleString()}</span></p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">回購與流失</h1>
        <p className="mt-1 text-sm text-slate-500">
          監控會員回購週期與流失風險，透過 Cohort 分析了解不同群體的留存表現。
        </p>
      </div>

      {/* Control Bar — no 欄位選擇器 on this page */}
      <AnalyticsControlBar
        dimensionFields={[
          {
            id: 'category', label: '商品分類',
            options: [
              { id: 'bags', label: '包袋' },
              { id: 'clothing', label: '服飾' },
              { id: 'shoes', label: '鞋靴' },
              { id: 'accessory', label: '配件' },
              { id: 'beauty', label: '美妝' },
              { id: 'lifestyle', label: '生活用品' },
            ],
          },
          {
            id: 'product', label: '商品ID',
            options: Array.from({ length: 12 }, (_, i) => ({ id: `P${1001 + i}`, label: `P${1001 + i}` })),
          },
          {
            id: 'sku', label: 'SKU ID',
            options: Array.from({ length: 20 }, (_, i) => ({ id: `SKU-${String.fromCharCode(65 + i)}`, label: `SKU-${String.fromCharCode(65 + i)}` })),
          },
          {
            id: 'gender', label: '性別',
            options: [{ id: 'female', label: '女性' }, { id: 'male', label: '男性' }],
          },
          {
            id: 'age', label: '年齡',
            options: [
              { id: '18-24', label: '18–24' },
              { id: '25-34', label: '25–34' },
              { id: '35-44', label: '35–44' },
              { id: '45-54', label: '45–54' },
              { id: '55+', label: '55+' },
            ],
          },
          {
            id: 'tier', label: '會員階級',
            options: ['一般', '銅', '銀', '金', '鑽石'].map(t => ({ id: t, label: t })),
          },
        ]}
        selectedDimensionsMap={selectedDimensionsMap}
        onDimensionsMapChange={setSelectedDimensionsMap}
        hideTimeGranularity={true}
        showMetricSelector={false}
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
            <div className={`absolute top-0 right-0 p-5 opacity-[0.04] group-hover:scale-110 transition-transform ${kpi.color}`}>
              <kpi.icon className="w-14 h-14" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight">{kpi.title}</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Section 1: 回購行為分析 ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-indigo-300 rounded" />
          回購行為分析
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Chart 1: 回購週期分布 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 mb-1">📅 回購週期分布</h3>
            <p className="text-xs text-slate-400 mb-4">會員兩次購買之間的間隔天數分布</p>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={repurchaseHistData}
                  margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                  onClick={(s: any) => {
                    const p = s?.activePayload?.[0]?.payload;
                    if (p) openDrawer(`回購週期 ${p.range} 會員名單`);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={histTooltip('回購間隔')} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" name="會員數" radius={[6, 6, 0, 0]} cursor="pointer">
                    {repurchaseHistData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${240 - i * 8}, 65%, ${68 - i * 3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: 流失預警分布 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 mb-4">🚦 流失預警分布</h3>
            <div className="flex gap-4 items-center">
              <div style={{ height: 240, flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={churnDonutData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="78%"
                      paddingAngle={2}
                      onClick={d => openDrawer(`${d.name} 會員名單`, m => m.churnRisk === d.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      {churnDonutData.map(entry => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                      <Label content={<ChurnDonutCenter />} position="center" />
                    </Pie>
                    <Tooltip content={churnTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-32 shrink-0 space-y-2">
                {churnDonutData.map(d => (
                  <button
                    key={d.name}
                    onClick={() => openDrawer(`${d.name} 會員名單`, m => m.churnRisk === d.name)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs font-bold text-slate-700">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-slate-900">{d.count.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">{((d.count / totalChurn) * 100).toFixed(1)}%</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: 會員活躍狀態 ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-emerald-300 rounded" />
          會員活躍狀態
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Chart 3: 休眠天數分布 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 mb-1">💤 休眠天數分布</h3>
            <p className="text-xs text-slate-400 mb-4">距離最後一次購買的天數分布</p>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dormancyHistData}
                  margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                  onClick={(s: any) => {
                    const p = s?.activePayload?.[0]?.payload;
                    if (p) openDrawer(`休眠 ${p.range} 會員名單`);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={histTooltip('休眠天數')} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" name="會員數" radius={[6, 6, 0, 0]} cursor="pointer">
                    {dormancyHistData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${160 - i * 15}, ${55 + i * 5}%, ${60 - i * 4}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: 購買次數 vs 休眠天數 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 mb-1">🫧 購買次數 vs 休眠天數</h3>
            <p className="text-xs text-slate-400 mb-4">X軸：購買次數 / Y軸：休眠天數 / 泡泡大小：會員數</p>
            <div style={{ height: 260 }}>
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
                    dataKey="y" type="number" name="休眠天數"
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={v => `${v}天`}
                  />
                  <ZAxis dataKey="z" range={[60, 600]} name="會員數" />
                  <Tooltip content={bubbleTooltip} />
                  <Scatter
                    data={activityBubbleData}
                    fill="#6366f1"
                    fillOpacity={0.55}
                    onClick={(d: any) => openDrawer(`${d.label} 會員名單`)}
                    style={{ cursor: 'pointer' }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Cohort 留存分析 ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-amber-300 rounded" />
          Cohort 留存分析
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          時間區間篩選代表「首購時間」。點擊儲存格可查看對應會員名單。灰色格子代表尚未滿足回購天數條件。
        </p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RetentionHeatmap
            title="📆 首購時間 Cohort"
            subtitle="以首購月份分群，分析 30 / 60 / 90 天回購率"
            rows={cohortByMonth}
            onCellClick={(row, period, val) => {
              if (val === null) return;
              openDrawer(`${row} 首購 · ${period} 回購會員名單`);
            }}
          />
          <RetentionHeatmap
            title="🛍️ 首購商品 Cohort"
            subtitle="以首購商品分群，分析 30 / 60 / 90 天回購率"
            rows={cohortByProduct}
            onCellClick={(row, period, val) => {
              if (val === null) return;
              openDrawer(`首購「${row}」· ${period} 回購會員名單`);
            }}
          />
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
