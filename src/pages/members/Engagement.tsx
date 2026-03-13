import { useState } from 'react';
import {
  MessageSquare, Smartphone, Mail, Bell,
  BarChart as BarIcon, DollarSign,
  Filter, ArrowRight, Zap, Target
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import MemberDrilldownDrawer from '../../components/MemberDrilldownDrawer';
import { metrics, dimensions, membersData } from '../../data/memberMockData';

const channelComparison = [
  { name: 'LINE', clicks: 12450, fill: '#06c755' },
  { name: 'APP 推播', clicks: 8420, fill: '#4f46e5' },
  { name: 'EDM', clicks: 3200, fill: '#818cf8' },
  { name: 'SMS', clicks: 1200, fill: '#94a3b8' },
];

const funnelData = [
  { value: 100000, name: '訊息發送', fill: '#f1f5f9' },
  { value: 25000, name: '訊息點擊', fill: '#c7d2fe' },
  { value: 4500, name: '下單購買', fill: '#4f46e5' },
];

const revenueContribution = [
  {
    name: 'Revenue',
    'LINE': 450000,
    'APP 推播': 320000,
    'EDM': 120000,
    'SMS': 45000
  }
];

export default function Engagement() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['order_count', 'total_spent']);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [filteredMembersForDrawer, setFilteredMembersForDrawer] = useState<any[]>([]);

  const kpis = [
    { title: 'LINE 點擊率', value: '12.4%', change: '+1.5%', icon: MessageSquare, color: 'text-[#06c755]', bg: 'bg-[#a3ffbf]/20' },
    { title: 'APP 推播點擊率', value: '18.2%', change: '+3.4%', icon: Bell, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'EDM 點擊率', value: '3.5%', change: '-0.2%', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'SMS 點擊率', value: '1.2%', change: '+0.1%', icon: Smartphone, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  const handleChannelClick = (channel: string) => {
    setDrawerTitle(`${channel} 互動會員名單`);
    const filtered = membersData.filter(m => {
      if (channel === 'LINE') return m.interactions.line_clicks > 5;
      if (channel === 'APP 推播') return m.interactions.app_clicks > 5;
      if (channel === 'EDM') return m.interactions.edm_clicks > 0;
      return m.interactions.sms_clicks > 0;
    });
    setFilteredMembersForDrawer(filtered);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">會員互動成效</h1>
        <p className="mt-1 text-sm text-slate-500">
          追蹤各行銷渠道的觸達效率與轉單表現，優化各通路訊息的發送時機與內容權重。
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
        singleRowLayout={true}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between overflow-hidden">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{kpi.title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-slate-900">{kpi.value}</h3>
                  <span className={`text-[10px] font-bold ${kpi.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {kpi.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Comparison */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative group overflow-hidden">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-8">
            <BarIcon className="w-4 h-4 text-indigo-500" />
            互動渠道點擊量比較
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelComparison} onClick={(s: any) => s?.activePayload && handleChannelClick(s.activePayload[0].payload.name)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="clicks" radius={[12, 12, 0, 0]} cursor="pointer" barSize={50}>
                  {channelComparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="clicks" position="top" style={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Funnel */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-8">
            <Filter className="w-4 h-4 text-indigo-500" />
            觸達轉換漏斗 (CRM Funnel)
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel
                  data={funnelData}
                  dataKey="value"
                  isAnimationActive
                  nameKey="name"
                >
                  <LabelList position="right" fill="#475569" stroke="none" dataKey="name" style={{ fontSize: 12, fontWeight: 600 }} />
                  <LabelList position="center" fill="#475569" stroke="none" dataKey="value" style={{ fontSize: 11, fontWeight: 700 }} formatter={(val: any) => val?.toLocaleString?.() || val} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Revenue Contribution Stacked Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-8">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          渠道營收成效貢獻
        </h3>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={revenueContribution}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" hide />
              <Tooltip />
              <Legend iconType="circle" />
              <Bar dataKey="LINE" stackId="a" fill="#06c755" radius={0} onClick={() => handleChannelClick('LINE')} cursor="pointer" />
              <Bar dataKey="APP 推播" stackId="a" fill="#4f46e5" radius={0} onClick={() => handleChannelClick('APP 推播')} cursor="pointer" />
              <Bar dataKey="EDM" stackId="a" fill="#818cf8" radius={0} onClick={() => handleChannelClick('EDM')} cursor="pointer" />
              <Bar dataKey="SMS" stackId="a" fill="#94a3b8" radius={[0, 8, 8, 0]} onClick={() => handleChannelClick('SMS')} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest px-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Insight Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all cursor-pointer">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-800">最佳互動時段</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            APP 推播在 **12:30** 與 **21:00** 點擊率最高，建議將主要活動推播安排在此區間。
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all cursor-pointer">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-800">高轉單渠道</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            LINE 雖然發送成本最高，但轉單金額 (ROI) 表現最為優異，適合高客單價活動。
          </p>
        </div>
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white relative flex flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">AI 建議</h4>
            <p className="text-sm font-bold leading-relaxed">檢測到 SMS 點擊率正在持續下滑，建議大幅縮減預算並轉移至 LINE 官方帳號。</p>
          </div>
          <div className="mt-4 flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold hover:underline">採納建議</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-500 rounded-full blur-2xl opacity-50"></div>
        </div>
      </div>

      {/* Engagement Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-800">會員最近互動明細</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">會員ID</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">最高互動渠道</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">點擊次數 (當月)</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">是否下單</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">營收貢獻</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {membersData.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-slate-700">{m.id}</p>
                    <p className="text-[10px] text-slate-400">{m.region}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      {m.interactions.app_clicks > m.interactions.line_clicks ? (
                        <><Bell className="w-3 h-3 text-indigo-500" /> APP 推播</>
                      ) : (
                        <><MessageSquare className="w-3 h-3 text-[#06c755]" /> LINE</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-mono font-bold text-slate-600">
                    {m.interactions.app_clicks + m.interactions.line_clicks}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {m.interactions.total_orders > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">YES</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold">NO</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-mono font-bold text-indigo-600">
                    ${m.interactions.revenue.toLocaleString()}
                  </td>
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
