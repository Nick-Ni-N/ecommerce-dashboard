import { useState } from 'react';
import { Users, UserCheck, RefreshCw, Star, X, User } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList,
} from 'recharts';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import { MEMBER_DIMENSION_FIELDS } from '../../data/memberDimensions';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DrawerMember {
  id: string;
  tier: string;
  segment: string;
  totalSpent: number;
  orderCount: number;
}

// ─── Static Data ─────────────────────────────────────────────────────────────
const KPIS = [
  { title: '新會員數', value: '3,200', trend: '+12.4%', up: true, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { title: '首購會員數', value: '8,000', trend: '+5.8%', up: true, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { title: '二購會員數', value: '4,400', trend: '+3.2%', up: true, icon: RefreshCw, color: 'text-sky-600', bg: 'bg-sky-50' },
  { title: '高價值會員數', value: '2,700', trend: '+8.5%', up: true, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const FUNNEL_DATA = [
  { name: '訪客', value: 45000, fill: '#c7d2fe' },
  { name: '首購會員', value: 8000, fill: '#818cf8' },
  { name: '二購會員', value: 4400, fill: '#6366f1' },
  { name: '多次購買會員', value: 4260, fill: '#4f46e5' },
  { name: '高價值會員', value: 2700, fill: '#f59e0b' },
];

const CONVERSION_DATA = [
  { month: '10月', rate: 48 },
  { month: '11月', rate: 52 },
  { month: '12月', rate: 61 },
  { month: '01月', rate: 55 },
  { month: '02月', rate: 58 },
  { month: '03月', rate: 63 },
];

const GROWTH_STRUCTURE = [
  { month: '10月', once: 1200, twice: 620, multi: 380 },
  { month: '11月', once: 1350, twice: 710, multi: 420 },
  { month: '12月', once: 1580, twice: 850, multi: 510 },
  { month: '01月', once: 1420, twice: 790, multi: 470 },
  { month: '02月', once: 1650, twice: 880, multi: 530 },
  { month: '03月', once: 1820, twice: 960, multi: 590 },
];

const FIRST_PURCHASE_PRODUCTS = [
  { name: '魚油', count: 1840, color: '#6366f1' },
  { name: '苦瓜胜肽', count: 1520, color: '#818cf8' },
  { name: '大餐包', count: 1280, color: '#10b981' },
  { name: '益生菌', count: 980, color: '#f59e0b' },
  { name: '膠原蛋白', count: 760, color: '#ec4899' },
  { name: '維生素C', count: 620, color: '#06b6d4' },
];

const MOCK_MEMBERS: DrawerMember[] = Array.from({ length: 12 }, (_, i) => ({
  id: `M${20001 + i}`,
  tier: ['一般', '銅', '銀', '金', '鑽石'][i % 5],
  segment: ['新會員', '成長會員', '高價值會員'][i % 3],
  totalSpent: (i + 1) * 3200,
  orderCount: [1, 2, 3, 5, 7, 10][i % 6],
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
                    <div className="flex gap-1.5 mt-0.5">
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">{m.tier}</span>
                      <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-bold">{m.segment}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-center">
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
export default function Lifecycle() {
  const [dateRangeType, setDateRangeType] = useState('最近30天');
  const [customStart, setCustomStart] = useState('2026-02-01');
  const [customEnd, setCustomEnd] = useState('2026-03-13');
  const [selectedDimensionsMap, setSelectedDimensionsMap] = useState<Record<string, string[]>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerMembers, setDrawerMembers] = useState<DrawerMember[]>([]);

  const openDrawer = (title: string, slice = MOCK_MEMBERS.length) => {
    setDrawerTitle(title);
    setDrawerMembers(MOCK_MEMBERS.slice(0, slice));
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">會員生命週期</h1>
        <p className="mt-1 text-sm text-slate-500">
          追蹤會員從訪客到高價值客戶的成長路徑，監控各階段轉換率與成長結構。
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map(kpi => (
          <div
            key={kpi.title}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative group cursor-pointer"
            onClick={() => openDrawer(kpi.title, 8)}
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

      {/* ── Row 1: Funnel + 首購→二購轉換率 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Life cycle funnel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">🔽 會員生命週期漏斗</h3>
          <p className="text-xs text-slate-400 mb-4">點擊各階段查看該層會員名單</p>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={funnelTooltip} />
                <Funnel
                  dataKey="value"
                  data={FUNNEL_DATA}
                  isAnimationActive
                  onClick={(d: any) => openDrawer(`${d.name} 名單`, 8)}
                  style={{ cursor: 'pointer' }}
                >
                  <LabelList
                    position="right"
                    fill="#475569"
                    stroke="none"
                    dataKey="name"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <LabelList
                    position="center"
                    fill="#fff"
                    stroke="none"
                    dataKey="value"
                    formatter={(v: any) => (v as number).toLocaleString()}
                    style={{ fontSize: 11, fontWeight: 700 }}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 首購→二購轉換率 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">📈 首購 → 二購轉換率</h3>
          <p className="text-xs text-slate-400 mb-4">二購率 = 二購會員 / 首購會員（點擊月份查看名單）</p>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={CONVERSION_DATA}
                margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
                onClick={(s: any) => {
                  const month = s?.activePayload?.[0]?.payload?.month;
                  if (month) openDrawer(`${month} 二購會員名單`, 6);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
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
                <Bar dataKey="rate" name="二購率" radius={[6, 6, 0, 0]} cursor="pointer">
                  {CONVERSION_DATA.map((_d, i) => (
                    <Cell key={i} fill={i === CONVERSION_DATA.length - 1 ? '#f59e0b' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: 成長結構 + 首購商品 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 3: 新會員成長結構 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">📊 新會員成長結構</h3>
          <p className="text-xs text-slate-400 mb-4">依購買次數分類：只購買一次 / 二購 / 多購</p>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GROWTH_STRUCTURE} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs min-w-[140px]">
                        <p className="font-bold text-slate-700 mb-2">{label}</p>
                        {payload.map((p: any) => (
                          <p key={p.dataKey} className="flex justify-between gap-3 mb-0.5" style={{ color: p.fill }}>
                            <span>{p.name}</span>
                            <span className="font-mono font-bold">{p.value.toLocaleString()}</span>
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="once" name="只購買一次" fill="#94a3b8" radius={[0, 0, 0, 0]} stackId="a" cursor="pointer"
                  onClick={() => openDrawer('只購買一次 會員名單', 8)} />
                <Bar dataKey="twice" name="二購會員" fill="#818cf8" radius={[0, 0, 0, 0]} stackId="a" cursor="pointer"
                  onClick={() => openDrawer('二購會員名單', 8)} />
                <Bar dataKey="multi" name="多購會員" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" cursor="pointer"
                  onClick={() => openDrawer('多購會員名單', 8)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-3 justify-center">
            {[{ label: '只購買一次', color: '#94a3b8' }, { label: '二購會員', color: '#818cf8' }, { label: '多購會員', color: '#10b981' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: 首購商品分布 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-1">🛒 首購商品分布</h3>
          <p className="text-xs text-slate-400 mb-4">新會員第一筆訂單的商品分布（點擊查看會員名單）</p>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={FIRST_PURCHASE_PRODUCTS}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                onClick={(s: any) => {
                  const name = s?.activePayload?.[0]?.payload?.name;
                  if (name) openDrawer(`首購「${name}」會員名單`, 8);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
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
                <Bar dataKey="count" name="首購人數" radius={[6, 6, 0, 0]} cursor="pointer">
                  {FIRST_PURCHASE_PRODUCTS.map(d => <Cell key={d.name} fill={d.color} />)}
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
