import { useState } from 'react';
import {
  Ticket, Coins, TrendingUp, DollarSign,
  PieChart as PieIcon, LineChart as LineIcon, BarChart as BarIcon,
  Lightbulb, ArrowRight, Star
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import MemberDrilldownDrawer from '../../components/MemberDrilldownDrawer';
import { metrics, dimensions, membersData } from '../../data/memberMockData';

const toolDistribution = [
  { name: '折價券', value: 3420, fill: '#4f46e5' },
  { name: 'Co幣', value: 1250, fill: '#f59e0b' },
];

const revenueTrend = [
  { name: '10月', coupon: 450000, points: 120000 },
  { name: '11月', coupon: 520000, points: 150000 },
  { name: '12月', coupon: 680000, points: 210000 },
  { name: '1月', coupon: 590000, points: 180000 },
  { name: '2月', coupon: 620000, points: 195000 },
  { name: '3月', coupon: 710000, points: 240000 },
];

const freqData = [
  { freq: '1次', count: 1840 },
  { freq: '2-3次', count: 2450 },
  { freq: '4-5次', count: 1200 },
  { freq: '6-10次', count: 450 },
  { freq: '10次以上', count: 120 },
];

export default function CouponAnalysis() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['coupon_usage', 'points_usage']);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [filteredMembersForDrawer, setFilteredMembersForDrawer] = useState<any[]>([]);

  const kpis = [
    { title: '折價券使用率', value: '42.8%', change: '+5.4%', icon: Ticket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Co幣使用率', value: '18.2%', change: '+2.1%', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: '折價券帶動營收', value: '$2,450k', change: '+18.2%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Co幣帶動營收', value: '$840k', change: '+12.5%', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const handleChartClick = (name: string) => {
    setDrawerTitle(`${name} 使用者名單`);
    let filtered: any[] = [];
    if (name === '折價券') filtered = membersData.filter(m => parseInt(m.metrics.coupon_usage) > 0);
    else if (name === 'Co幣') filtered = membersData.filter(m => parseInt(m.metrics.points_usage) > 0);
    else filtered = membersData.filter(m => parseInt(m.metrics.coupon_usage) > 2); // Freq drilldown

    setFilteredMembersForDrawer(filtered);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">優惠工具分析</h1>
        <p className="mt-1 text-sm text-slate-500">
          評估折價券與 Co幣對營收的轉化貢獻與套利風險，優化行銷預算的投放效率。
        </p>
      </div>

      <AnalyticsControlBar
        metrics={metrics}
        dimensions={dimensions}
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
        selectedDimensions={selectedDimensions}
        onDimensionsChange={setSelectedDimensions}
        hideTimeGranularity={true}
        showMetricSelector={false}
        singleRowLayout={true}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {kpi.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500 font-medium">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</h3>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50 group-hover:bg-indigo-500 transition-colors"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Donut Usage */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-8">
            <PieIcon className="w-4 h-4 text-indigo-500" />
            優惠工具使用比例
          </h3>
          <div className="flex-1 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart onClick={(s: any) => s?.activePayload && handleChartClick(s.activePayload[0].payload.name)}>
                <Pie
                  data={toolDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  cursor="pointer"
                >
                  {toolDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {toolDistribution.map(t => (
              <div key={t.name} className="p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleChartClick(t.name)}>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.name}</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{t.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Line Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-8">
            <LineIcon className="w-4 h-4 text-emerald-500" />
            優惠工具營收趨勢分析
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="coupon" name="折價券營收" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="points" name="Co幣營收" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Freq Distrib */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-8">
          <BarIcon className="w-4 h-4 text-indigo-500" />
          優惠工具使用頻率分布
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={freqData} onClick={() => handleChartClick('高頻率')}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="freq" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#818cf8" radius={[8, 8, 0, 0]} cursor="pointer" barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-lg border-indigo-400/20 text-white relative overflow-hidden">
          <Lightbulb className="w-10 h-10 text-indigo-200/50 absolute -top-2 -right-2 transform rotate-12" />
          <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-4">核心洞察 01</h4>
          <p className="text-base font-bold leading-relaxed mb-6">"折價券" 對於首購行為的轉化效率提高 24%，但對回購率貢獻較低。</p>
          <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-200 hover:text-white transition-colors cursor-pointer group">
            查看詳細報告 <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-800">高敏感會員特徵</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">北部女性、18-24 歲客群對 Co幣折抵最具反應，建議針對此客群增加回饋力道。</p>
          <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md inline-block">建議調整權益內容</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs text-slate-400 font-bold mb-1 uppercase">套利風險提示</p>
          <h4 className="text-lg font-bold text-slate-800">查獲 12 名疑似刷單帳號</h4>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-500 underline cursor-pointer">立即查看詳細</span>
            <span className="text-[10px] text-slate-300 italic">Last scan: 2h ago</span>
          </div>
        </div>
      </div>

      {/* High Usage Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800">優惠高敏感會員表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">會員ID</th>
                <th className="px-6 py-4 text-center font-bold text-slate-400 uppercase tracking-widest text-[10px]">折價券次數</th>
                <th className="px-6 py-4 text-center font-bold text-slate-400 uppercase tracking-widest text-[10px]">Co幣次數</th>
                <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">折價券帶動</th>
                <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Co幣帶動</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {membersData.slice(0, 5).map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-slate-700">{m.id}</span>
                    <span className="ml-2 text-[10px] text-slate-400">{m.tier}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-indigo-600">{m.metrics.coupon_usage}</td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-amber-600">{m.metrics.points_usage}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{m.metrics.coupon_revenue}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{m.metrics.points_revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MemberDrilldownDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drawerTitle}
        members={filteredMembersForDrawer}
      />
    </div>
  );
}
