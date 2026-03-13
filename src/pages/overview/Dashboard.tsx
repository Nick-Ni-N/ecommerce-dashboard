import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, ShoppingBag, Eye, Download } from 'lucide-react';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import SubpagePreviewCards from '../../components/SubpagePreviewCards';
import FilterBadges from '../../components/FilterBadges';
import { useBITable } from '../../hooks/useBITable';

const metrics = [
  { id: 'gmv', label: '總交易額 (GMV)' },
  { id: 'revenue', label: '實際營收' },
  { id: 'orders', label: '訂單數' },
  { id: 'aov', label: '客單價 (AOV)' },
  { id: 'profit', label: '淨獲利' },
  { id: 'margin', label: '毛利率' },
  { id: 'target', label: '目標達成率' },
];

const dimensions = [
  { id: 'device', label: '裝置型號' },
  { id: 'channel', label: '進站渠道' },
  { id: 'new_returning', label: '新舊會員' },
];

const kpis = [
  { name: '總交易額 (GMV)', value: '$1,245,600', change: '+12.5%', icon: DollarSign, positive: true },
  { name: '實際營收', value: '$984,200', change: '+8.2%', icon: ShoppingBag, positive: true },
  { name: '訂單數', value: '1,432', change: '-2.4%', icon: Users, positive: false },
  { name: '總瀏覽量', value: '45,231', change: '+18.1%', icon: Eye, positive: true },
];

const dates = [
  '03/01', '03/02', '03/03', '03/04', '03/05', '03/06', '03/07', '03/08', '03/09', '03/10', '03/11', '03/12', '03/13', '03/14'
];

const matrixDataByMetric: Record<string, string[]> = {
  gmv: ['$45,200', '$52,100', '$48,300', '$61,400', '$59,200', '$64,500', '$71,200', '$68,400', '$62,100', '$58,900', '$63,200', '$67,800', '$75,400', '$82,100'],
  revenue: ['$39,500', '$45,200', '$41,800', '$53,100', '$51,400', '$56,200', '$62,100', '$59,800', '$54,300', '$51,200', '$55,400', '$59,100', '$66,500', '$72,300'],
  orders: ['54', '62', '58', '71', '68', '75', '82', '79', '72', '68', '74', '80', '88', '95'],
  aov: ['$837', '$840', '$832', '$864', '$870', '$860', '$868', '$865', '$862', '$866', '$854', '$847', '$856', '$864'],
  profit: ['$12,400', '$14,500', '$13,200', '$17,100', '$16,500', '$18,200', '$20,100', '$19,300', '$17,400', '$16,200', '$17,800', '$19,100', '$21,500', '$23,400'],
  margin: ['27.4%', '27.8%', '27.3%', '27.8%', '27.8%', '28.2%', '28.2%', '28.2%', '28.0%', '27.5%', '28.1%', '28.1%', '28.5%', '28.5%'],
  target: ['92%', '104%', '96%', '122%', '118%', '129%', '142%', '136%', '124%', '117%', '126%', '135%', '150%', '164%']
};

// Transform matrix data for useBITable
// In Matrix layout, metrics are items
const tableData = metrics.map(m => ({
  id: m.id,
  label: m.label,
  values: matrixDataByMetric[m.id],
  ...dates.reduce((acc, date, idx) => ({ ...acc, [date]: matrixDataByMetric[m.id][idx] }), {})
}));

const subpages = [
  { title: '營收趨勢', description: '深入分析各週期營收變化與淡旺季影響。', href: '/overview/revenue-trend' },
  { title: '新客 vs 回購', description: '比較新客獲取成本與舊客回購貢獻佔比。', href: '/overview/new-vs-returning' },
  { title: '轉換漏斗', description: '檢視從進站、加入購物車到結帳的流失節點。', href: '/overview/conversion-funnel' },
  { title: '品類結構', description: '拆解佔比最高的主力與長尾商品結構。', href: '/overview/category-structure' },
];

export default function Dashboard() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['gmv', 'revenue', 'orders', 'aov']);

  const labelMap = useMemo(() => {
    const map: Record<string, string> = { label: '指標名稱' };
    dates.forEach(d => { map[d] = d; });
    return map;
  }, []);

  // Filter the data based on selected metrics
  const displayData = useMemo(() => {
    return tableData.filter(d => selectedMetrics.includes(d.id));
  }, [selectedMetrics]);

  const {
    paginatedData,
    filterBadges,
    clearAllFilters,
    removeFilter,
    // Note: Overview might not need full pagination yet if metrics are few, 
    // but we'll include the filter state for consistency.
  } = useBITable({
    data: displayData,
    initialPageSize: 100, // Metrics are usually few, show all or scroll
    labelMap
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">總覽資料表</h1>
        <p className="mt-2 text-sm text-slate-600">
          全站宏觀指標儀表板，提供電商營運最核心的數據總覽，協助快速掌握整體健康度。
        </p>
      </div>

      <AnalyticsControlBar
        metrics={metrics}
        dimensions={dimensions}
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((card) => (
          <div key={card.name} className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.name}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                <card.icon className="h-6 w-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {card.positive ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-rose-500" />}
              <p className={`ml-2 flex items-baseline text-sm font-semibold ${card.positive ? 'text-emerald-600' : 'text-rose-600'}`}>{card.change} <span className="ml-1 text-slate-500 font-normal">較上期</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Data Table */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-20">
          <h2 className="text-lg font-semibold text-slate-900">詳細數據總表 (Matrix)</h2>
          <div className="flex items-center gap-3">
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Download className="w-4 h-4" />
              匯出 CSV
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/30">
          <FilterBadges
            filters={filterBadges}
            onRemove={removeFilter}
            onClearAll={clearAllFilters}
          />
        </div>

        <div className="overflow-x-auto relative scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="min-w-full divide-y divide-slate-200 border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-30">
              <tr>
                <th scope="col" className="sticky left-0 z-40 bg-slate-50 py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 min-w-[200px] shadow-[1px_0_0_0_#e2e8f0]">指標名稱</th>
                {dates.map(date => (
                  <th key={date} scope="col" className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900 min-w-[120px] whitespace-nowrap bg-slate-50">{date}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-mono">
              {paginatedData.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-slate-900 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] transition-colors">{m.label}</td>
                  {dates.map((date, idx) => (
                    <td key={idx} className="whitespace-nowrap px-4 py-4 text-sm text-right">{(m as any)[date]}</td>
                  ))}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={dates.length + 1} className="py-12 text-center text-sm text-slate-500">無符合條件的指標數據。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SubpagePreviewCards subpages={subpages} />
    </div>
  );
}
