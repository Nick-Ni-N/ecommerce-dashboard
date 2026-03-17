import { useState } from 'react';
import { Users, Target, TrendingUp, RefreshCw, X, User } from 'lucide-react';
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList,
} from 'recharts';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import { MEMBER_DIMENSION_FIELDS } from '../../data/memberDimensions';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DrawerMember {
  id: string;
  tier: string;
  daysToPurchase: number;
  totalSpent: number;
}

// ─── Static Data ─────────────────────────────────────────────────────────────
const KPIS = [
  { title: '新會員數', value: '3,200', trend: '+12.4%', up: true, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { title: '7天首購率', value: '38.2%', trend: '+2.1pp', up: true, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { title: '30天首購率', value: '61.5%', trend: '+1.8pp', up: true, icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
  { title: '90天二購率', value: '55.0%', trend: '-1.2pp', up: false, icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50' },
];

// Section B: 首購時間分布
const PURCHASE_TIMING = [
  { range: '0–3天', count: 820, cumRate: 25.6 },
  { range: '3–7天', count: 400, cumRate: 38.2 },
  { range: '7–14天', count: 380, cumRate: 50.1 },
  { range: '14–30天', count: 368, cumRate: 61.5 },
  { range: '>30天未購', count: 1232, cumRate: null },
];

// Section C: 首購商品來源
const FIRST_PRODUCT_DATA = [
  { name: '魚油', count: 1840, color: '#6366f1' },
  { name: '苦瓜胜肽', count: 1520, color: '#818cf8' },
  { name: '大餐包', count: 1280, color: '#10b981' },
  { name: '益生菌', count: 980, color: '#f59e0b' },
  { name: '膠原蛋白', count: 760, color: '#ec4899' },
];

// Section C: 新會員來源渠道
const CHANNEL_DATA = [
  { name: '廣告', count: 1250, color: '#6366f1' },
  { name: '自然流量', count: 820, color: '#10b981' },
  { name: 'LINE', count: 640, color: '#06b6d4' },
  { name: '推薦', count: 490, color: '#f59e0b' },
];

// Section D: 生命週期漏斗
const FUNNEL_DATA = [
  { name: '註冊會員', value: 3200, fill: '#c7d2fe' },
  { name: '首購會員', value: 1968, fill: '#818cf8' },
  { name: '二購會員', value: 1082, fill: '#6366f1' },
  { name: '多購會員', value: 680, fill: '#4f46e5' },
  { name: '高價值會員', value: 380, fill: '#f59e0b' },
];

// Section D: 二購轉換率分布
const SECOND_PURCHASE_CONVERSION = [
  { bucket: '7天', rate: 18 },
  { bucket: '14天', rate: 28 },
  { bucket: '30天', rate: 38 },
  { bucket: '60天', rate: 48 },
  { bucket: '90天', rate: 55 },
];

const MOCK_MEMBERS: DrawerMember[] = Array.from({ length: 10 }, (_, i) => ({
  id: `M${30001 + i}`,
  tier: ['一般', '銅', '銀', '金'][i % 4],
  daysToPurchase: [1, 2, 4, 5, 8, 11, 16, 22, 35, 45][i],
  totalSpent: (i + 1) * 1800,
}));

// ─── Inline Drawer ────────────────────────────────────────────────────────────
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
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">{m.tier}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">首購天數</p>
                    <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{m.daysToPurchase}天</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">累積消費</p>
                    <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">${m.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
            匯出 CSV
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewMemberConversion() {
  const [dateRangeType, setDateRangeType] = useState('最近30天');
  const [customStart, setCustomStart] = useState('2026-02-01');
  const [customEnd, setCustomEnd] = useState('2026-03-13');
  const [selectedDimensionsMap, setSelectedDimensionsMap] = useState<Record<string, string[]>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerMembers, setDrawerMembers] = useState<DrawerMember[]>([]);

  const openDrawer = (title: string, members = MOCK_MEMBERS) => {
    setDrawerTitle(title);
    setDrawerMembers(members);
    setDrawerOpen(true);
  };

  const funnelTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const idx = FUNNEL_DATA.findIndex(f => f.name === d.name);
    const prev = idx > 0 ? FUNNEL_DATA[idx - 1] : null;
    const rate = prev ? ((d.value / prev.value) * 100).toFixed(1) : null;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold text-slate-800 mb-1">{d.name}</p>
        <p className="text-slate-600">人數：<span className="font-mono font-bold">{d.value.toLocaleString()}</span></p>
        {rate && <p className="text-slate-500 mt-0.5">轉換自上層：<span className="font-mono font-bold text-indigo-600">{rate}%</span></p>}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">新會員轉換</h1>
        <p className="mt-1 text-sm text-slate-500">
          分析新會員來源品質、首購速度與早期生命週期轉換，協助優化新客引導與留存策略。
        </p>
      </div>

      {/* Control Bar */}
      <AnalyticsControlBar
        dimensionFields={MEMBER_DIMENSION_FIELDS}
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

      {/* ── Section A: KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map(kpi => (
          <div
            key={kpi.title}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative group cursor-pointer"
            onClick={() => openDrawer(kpi.title)}
          >
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

      {/* ── Section B: 首購轉換分析 ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-base font-bold text-slate-800 mb-1">⏱️ 首購時間分布 + 累計首購率</h3>
        <p className="text-xs text-slate-400 mb-5">
          各區間首購人數（柱）與累計首購率（折線）—— 點擊區間查看該批會員名單
        </p>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={PURCHASE_TIMING}
              margin={{ top: 16, right: 52, bottom: 8, left: 0 }}
              onClick={(s: any) => {
                const range = s?.activePayload?.[0]?.payload?.range;
                if (range) openDrawer(`${range} 首購會員名單`, MOCK_MEMBERS.slice(0, 6));
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={v => v.toLocaleString()}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={v => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs min-w-[160px]">
                      <p className="font-bold text-slate-700 mb-2">{label}</p>
                      {payload.map((p: any) => p.value !== null && (
                        <p key={p.dataKey} className="flex justify-between gap-3 mb-0.5" style={{ color: p.color }}>
                          <span>{p.name}</span>
                          <span className="font-mono font-bold">
                            {p.dataKey === 'cumRate' ? `${p.value}%` : p.value.toLocaleString()}
                          </span>
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="count"
                name="首購人數"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(barData: any) => openDrawer(`${barData.range} 首購會員名單`, MOCK_MEMBERS.slice(0, 6))}
              >
                {PURCHASE_TIMING.map((d, i) => (
                  <Cell key={i} fill={d.range === '>30天未購' ? '#fca5a5' : '#818cf8'} />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumRate"
                name="累計首購率"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-3 justify-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#818cf8]" />已首購人數
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#fca5a5]" />&gt;30天未購
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 bg-[#f59e0b] rounded" />累計首購率
          </div>
        </div>
      </div>

      {/* ── Section C: 新會員來源品質 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 首購商品來源 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">🛒 首購商品來源</h3>
          <p className="text-xs text-slate-400 mb-4">新會員第一次購買的商品排行（點擊查看名單）</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={FIRST_PRODUCT_DATA}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
                        <p className="font-bold mb-1" style={{ color: d.color }}>{d.name}</p>
                        <p className="text-slate-600">首購人數：<span className="font-mono font-bold">{d.count.toLocaleString()}</span></p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  name="首購人數"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(barData: any) => openDrawer(`首購「${barData.name}」會員名單`)}
                >
                  {FIRST_PRODUCT_DATA.map(d => <Cell key={d.name} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 新會員來源渠道 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">📡 新會員來源渠道</h3>
          <p className="text-xs text-slate-400 mb-4">各渠道帶來的新會員數量（點擊查看名單）</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={CHANNEL_DATA}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
                        <p className="font-bold mb-1" style={{ color: d.color }}>{d.name}</p>
                        <p className="text-slate-600">新會員數：<span className="font-mono font-bold">{d.count.toLocaleString()}</span></p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  name="新會員數"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(barData: any) => openDrawer(`${barData.name} 渠道新會員名單`)}
                >
                  {CHANNEL_DATA.map(d => <Cell key={d.name} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Section D Row 1: 生命週期漏斗 (full width card, centered narrow funnel) ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-base font-bold text-slate-800 mb-1">🔽 會員生命週期漏斗</h3>
        <p className="text-xs text-slate-400 mb-4">點擊各階段查看該層會員名單</p>
        <div className="flex justify-center">
          <div style={{ height: 420, width: '100%', maxWidth: 560 }}>
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip content={funnelTooltip} />
              <Funnel
                dataKey="value"
                data={FUNNEL_DATA}
                isAnimationActive
                onClick={(d: any) => openDrawer(`${d.name} 名單`, MOCK_MEMBERS.slice(0, 8))}
                style={{ cursor: 'pointer' }}
              >
                <LabelList
                  position="right"
                  fill="#475569"
                  stroke="none"
                  dataKey="name"
                  style={{ fontSize: 13, fontWeight: 600 }}
                />
                <LabelList
                  position="center"
                  fill="#fff"
                  stroke="none"
                  dataKey="value"
                  formatter={(v: any) => (v as number).toLocaleString()}
                  style={{ fontSize: 12, fontWeight: 700 }}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Section D Row 2: 二購轉換率分布 (half-width, centered) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-base font-bold text-slate-800 mb-1">📈 二購轉換率分布</h3>
        <p className="text-xs text-slate-400 mb-4">各時間區間內完成二購的累計比例（點擊查看名單）</p>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={SECOND_PURCHASE_CONVERSION}
              margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
              onClick={(s: any) => {
                const bucket = s?.activePayload?.[0]?.payload?.bucket;
                if (bucket) openDrawer(`${bucket}內完成二購 會員名單`, MOCK_MEMBERS.slice(0, 6));
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
                      <p className="font-bold text-slate-700 mb-1">{label}</p>
                      <p className="text-indigo-600 font-mono font-bold">二購率：{payload[0].value}%</p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="rate"
                name="二購轉換率"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(barData: any) => openDrawer(`${barData.bucket}內完成二購 會員名單`, MOCK_MEMBERS.slice(0, 6))}
              >
                {SECOND_PURCHASE_CONVERSION.map((_d, i) => (
                  <Cell key={i} fill={i === SECOND_PURCHASE_CONVERSION.length - 1 ? '#f59e0b' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
