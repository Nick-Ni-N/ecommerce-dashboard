import { useState, useMemo } from 'react';
import { Users, Star, DollarSign, UserX, X, User, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Label,
} from 'recharts';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import { MEMBER_DIMENSION_FIELDS } from '../../data/memberDimensions';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DrawerMember {
  id: string;
  tier: string;
  segment: string;
  dormantDays: number;
  totalSpent: number;
  orderCount: number;
  aov: number;
}

interface Segment {
  name: string;
  memberCount: number;
  revenue: number;
  color: string;
  desc: string;
}

// ─── Segmentation Data ───────────────────────────────────────────────────────
const SEGMENTS: Segment[] = [
  {
    name: '新會員',
    memberCount: 3200, revenue: 9600000,
    color: '#6366f1',
    desc: '首購後尚無回購紀錄，需引導第二次購買。',
  },
  {
    name: '成長會員',
    memberCount: 2540, revenue: 21090000,
    color: '#818cf8',
    desc: '已有 2–3 次購買，正在建立消費習慣。',
  },
  {
    name: '穩定會員',
    memberCount: 1860, revenue: 58480000,
    color: '#10b981',
    desc: '購買次數 ≥ 4，回購週期穩定。',
  },
  {
    name: '高價值會員',
    memberCount: 2700, revenue: 135000000,
    color: '#f59e0b',
    desc: '累積消費位於前 20%，是最重要的營收來源。',
  },
  {
    name: '可能流失',
    memberCount: 1420, revenue: 11230000,
    color: '#fb923c',
    desc: '流失預警黃燈，近期活躍度下滑。',
  },
  {
    name: '已流失',
    memberCount: 1680, revenue: 7560000,
    color: '#ef4444',
    desc: '流失預警紅燈，長期未購買，須喚回。',
  },
];

const totalSegmentMembers = SEGMENTS.reduce((s, d) => s + d.memberCount, 0);
const totalRevenue = SEGMENTS.reduce((s, d) => s + d.revenue, 0);

const revenueShareData = SEGMENTS.map(s => ({
  ...s,
  revenueShare: parseFloat(((s.revenue / totalRevenue) * 100).toFixed(1)),
}));

// 高價值會員健康度
const HV_HEALTH = [
  { name: '活躍高價值', count: 1850, color: '#10b981' },
  { name: '可能流失高價值', count: 560, color: '#fb923c' },
  { name: '已流失高價值', count: 290, color: '#ef4444' },
];

// 新會員成長能力
const NEW_MEMBER_GROWTH = [
  { name: '只購買一次', count: 3200, color: '#94a3b8' },
  { name: '二購會員', count: 1840, color: '#818cf8' },
  { name: '多購會員', count: 4400, color: '#10b981' },
];

// Mock drawer members
const TIERS = ['一般', '銅', '銀', '金', '鑽石'];
const mockMembers: DrawerMember[] = Array.from({ length: 36 }, (_, i) => ({
  id: `M${10001 + i}`,
  tier: TIERS[i % TIERS.length],
  segment: SEGMENTS[i % SEGMENTS.length].name,
  dormantDays: [3, 20, 50, 90, 150, 200][i % 6],
  totalSpent: (i + 1) * 5200,
  orderCount: [1, 2, 3, 5, 7, 10][i % 6],
  aov: Math.round(((i + 1) * 5200) / ([1, 2, 3, 5, 7, 10][i % 6])),
}));

// ─── Donut center label ───────────────────────────────────────────────────────
function SegDonutCenter({ viewBox }: any) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1e293b" fontSize="20" fontWeight="800">
        {totalSegmentMembers.toLocaleString()}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize="11">
        總會員數
      </text>
    </g>
  );
}

// ─── Drilldown Drawer ─────────────────────────────────────────────────────────
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
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-3">
          {members.length === 0
            ? <div className="h-40 flex items-center justify-center text-slate-400 text-sm">查無符合會員</div>
            : members.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.id}</p>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">{m.tier}</span>
                      <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-bold">{m.segment}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">購買次數</p>
                    <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{m.orderCount}次</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">累積消費</p>
                    <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">${m.totalSpent.toLocaleString()}</p>
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
          <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
            匯出此名單 (CSV)
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Segmentation() {
  const [dateRangeType, setDateRangeType] = useState('最近30天');
  const [customStart, setCustomStart] = useState('2026-02-01');
  const [customEnd, setCustomEnd] = useState('2026-03-13');
  const [selectedDimensionsMap, setSelectedDimensionsMap] = useState<Record<string, string[]>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerMembers, setDrawerMembers] = useState<DrawerMember[]>([]);

  const openDrawer = (segName: string) => {
    setDrawerTitle(`${segName} 名單`);
    setDrawerMembers(mockMembers.filter(m => m.segment === segName));
    setDrawerOpen(true);
  };

  const openDrawerByName = (name: string) => {
    setDrawerTitle(`${name} 名單`);
    setDrawerMembers(mockMembers.slice(0, 6));
    setDrawerOpen(true);
  };

  const handleBarClick = (state: any) => {
    const seg: Segment | undefined = state?.activePayload?.[0]?.payload;
    if (seg?.name) openDrawer(seg.name);
  };

  const kpis = useMemo(() => {
    const hvSeg = SEGMENTS.find(s => s.name === '高價值會員')!;
    const churnSeg = SEGMENTS.find(s => s.name === '已流失')!;
    return [
      { title: '總會員數', value: totalSegmentMembers.toLocaleString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+3.2%', up: true },
      { title: '高價值會員數', value: hvSeg.memberCount.toLocaleString(), icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+8.5%', up: true },
      { title: '高價值會員營收佔比', value: `${((hvSeg.revenue / totalRevenue) * 100).toFixed(1)}%`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+2.1pp', up: true },
      { title: '流失會員數', value: churnSeg.memberCount.toLocaleString(), icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50', trend: '+84', up: false },
    ];
  }, []);

  const donutTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as Segment;
    const pct = ((d.memberCount / totalSegmentMembers) * 100).toFixed(1);
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold mb-1" style={{ color: d.color }}>{d.name}</p>
        <p className="text-slate-600">會員數：<span className="font-mono font-bold">{d.memberCount.toLocaleString()}</span></p>
        <p className="text-slate-600">佔比：<span className="font-mono font-bold">{pct}%</span></p>
      </div>
    );
  };

  const revenueShareTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold mb-1" style={{ color: d.color }}>{d.name}</p>
        <p className="text-slate-600">營收占比：<span className="font-mono font-bold text-indigo-600">{payload[0].value}%</span></p>
        <p className="text-slate-400 mt-0.5">絕對值：<span className="font-mono">${(d.revenue / 1000000).toFixed(1)}M</span></p>
      </div>
    );
  };

  const simpleBarTooltip = (yLabel: string, fmt: (v: number) => string) =>
    ({ active, payload }: any) => {
      if (!active || !payload?.length) return null;
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
          <p className="font-bold mb-1" style={{ color: d.color }}>{d.name}</p>
          <p className="text-slate-600">{yLabel}：<span className="font-mono font-bold">{fmt(payload[0].value)}</span></p>
        </div>
      );
    };

  const hvHealthTooltip = simpleBarTooltip('高價值會員數', v => v.toLocaleString());
  const growthTooltip = simpleBarTooltip('會員數', v => v.toLocaleString());

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">會員分群</h1>
        <p className="mt-1 text-sm text-slate-500">
          依照 RFM 指標將會員分成六大群體，分析各群結構、營收貢獻與健康度。
        </p>
      </div>

      {/* Control Bar */}
      <AnalyticsControlBar
        dimensionFields={MEMBER_DIMENSION_FIELDS}
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
          </div>
        ))}
      </div>

      {/* ── Chart 1: 會員分群分布 Donut ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-base font-bold text-slate-800 mb-4">🍩 會員分群分布</h3>
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div style={{ height: 280, width: '100%', maxWidth: 320, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SEGMENTS}
                  dataKey="memberCount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="78%"
                  paddingAngle={2}
                  onClick={d => d.name && openDrawer(d.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {SEGMENTS.map(s => <Cell key={s.name} fill={s.color} />)}
                  <Label content={<SegDonutCenter />} position="center" />
                </Pie>
                <Tooltip content={donutTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            {SEGMENTS.map(s => {
              const pct = ((s.memberCount / totalSegmentMembers) * 100).toFixed(1);
              return (
                <button
                  key={s.name}
                  onClick={() => openDrawer(s.name)}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
                  style={{ borderLeftWidth: 3, borderLeftColor: s.color }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800">{s.name}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <p className="text-xl font-black text-slate-900">{s.memberCount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{pct}% 佔比</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 2: 各分群營收貢獻(%) + 高價值會員健康度 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 2: 各分群營收貢獻 (%) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">💰 各分群營收貢獻</h3>
          <p className="text-xs text-slate-400 mb-4">各分群佔總營收比例（點擊柱子查看名單）</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueShareData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 60]} />
                <Tooltip content={revenueShareTooltip} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="revenueShare" name="營收占比" radius={[6, 6, 0, 0]} cursor="pointer">
                  {revenueShareData.map(s => <Cell key={s.name} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: 高價值會員健康度 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">💎 高價值會員健康度</h3>
          <p className="text-xs text-slate-400 mb-4">高價值會員的活躍 / 可能流失 / 已流失分布（點擊查看名單）</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={HV_HEALTH}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                onClick={(s: any) => {
                  const name = s?.activePayload?.[0]?.payload?.name;
                  if (name) openDrawerByName(name);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={hvHealthTooltip} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" name="會員數" radius={[6, 6, 0, 0]} cursor="pointer">
                  {HV_HEALTH.map(d => <Cell key={d.name} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 3: 新會員成長能力 ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-base font-bold text-slate-800 mb-1">🌱 新會員成長能力</h3>
        <p className="text-xs text-slate-400 mb-4">新會員在首次購買後的消費深度分布（點擊查看名單）</p>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={NEW_MEMBER_GROWTH}
              layout="vertical"
              margin={{ top: 4, right: 48, bottom: 4, left: 0 }}
              onClick={(s: any) => {
                const name = s?.activePayload?.[0]?.payload?.name;
                if (name) openDrawerByName(name);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={100} />
              <Tooltip content={growthTooltip} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" name="會員數" radius={[0, 6, 6, 0]} cursor="pointer" label={{ position: 'right', fill: '#64748b', fontSize: 11, fontWeight: 700, formatter: (v: any) => (v as number).toLocaleString() }}>
                {NEW_MEMBER_GROWTH.map(d => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segmentation logic note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600">
        <p className="font-bold text-slate-700 mb-2">📋 分群規則（V1 — 簡化 RFM）</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: '新會員', rule: '購買次數 = 1', color: '#6366f1' },
            { name: '成長會員', rule: '購買次數 2–3', color: '#818cf8' },
            { name: '穩定會員', rule: '購買次數 ≥ 4', color: '#10b981' },
            { name: '高價值會員', rule: '累積消費前 20%', color: '#f59e0b' },
            { name: '可能流失', rule: '流失預警 = 黃燈', color: '#fb923c' },
            { name: '已流失', rule: '流失預警 = 紅燈', color: '#ef4444' },
          ].map(r => (
            <div key={r.name} className="flex items-start gap-1.5">
              <div className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{ background: r.color }} />
              <div>
                <p className="font-bold text-slate-700">{r.name}</p>
                <p className="text-slate-400">{r.rule}</p>
              </div>
            </div>
          ))}
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
