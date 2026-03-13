import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Globe, MousePointerClick, TrendingUp, Anchor, Download } from 'lucide-react';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import SubpagePreviewCards from '../../components/SubpagePreviewCards';
import TablePagination from '../../components/TablePagination';
import FilterBadges from '../../components/FilterBadges';
import ColumnHeader, { type ColDef } from '../../components/ColumnHeader';
import { useBITable } from '../../hooks/useBITable';

const metrics = [
  { id: 'sessions', label: '進站工作階段' },
  { id: 'users', label: '不重複訪客' },
  { id: 'bounce_rate', label: '跳出率' },
  { id: 'avg_session_duration', label: '平均停留時間' },
];

const dimensions = [
  { id: 'source_medium', label: '來源 / 媒介' },
  { id: 'campaign', label: '廣告活動' },
  { id: 'landing_page', label: '到達網頁' },
];

const kpis = [
  { name: '總進站流量', value: '342,100', change: '+18.4%', icon: Globe, positive: true },
  { name: '廣告點擊成本 (CPC)', value: '$12.4', change: '-5.2%', icon: MousePointerClick, positive: true },
  { name: '流量轉換率', value: '2.84%', change: '+0.15%', icon: TrendingUp, positive: true },
  { name: '跳出率', value: '45.2%', change: '+1.4%', icon: Anchor, positive: false },
];

const trafficData = [
  { source: 'google / cpc', sessions: '124,500', users: '98,200', bounce_rate: '42.1%', conversion: '2.4%' },
  { source: 'direct / none', sessions: '85,400', users: '65,100', bounce_rate: '35.4%', conversion: '4.1%' },
  { source: 'facebook / paidsocial', sessions: '64,200', users: '58,400', bounce_rate: '55.8%', conversion: '1.8%' },
  { source: 'ig / organic', sessions: '42,100', users: '35,000', bounce_rate: '48.2%', conversion: '1.5%' },
  { source: 'line / push', sessions: '25,900', users: '20,400', bounce_rate: '30.5%', conversion: '6.2%' },
  { source: 'referral / blog', sessions: '12,000', users: '8,500', bounce_rate: '28.4%', conversion: '3.1%' },
  { source: 'email / newsletter', sessions: '18,500', users: '14,200', bounce_rate: '32.1%', conversion: '5.8%' },
  { source: 'twitter / ads', sessions: '9,200', users: '7,800', bounce_rate: '62.5%', conversion: '1.2%' },
];

const subpages = [
  { title: '渠道成效', description: '比較各來源的流量規模、成本與終端投報率 (ROAS)。', href: '/traffic/channel-performance' },
  { title: '廣告漏斗', description: '追蹤前台廣告曝光到點擊進站的各階層耗損率。', href: '/traffic/ad-funnel' },
  { title: '拉新品質', description: '分析不同投放渠道帶進的新客留存率與終身價值。', href: '/traffic/acquisition-quality' },
  { title: '流量含金量', description: '計算每個進站 Session 平均能貢獻的營收金額 (RPS/RPV)。', href: '/traffic/value-per-visit' },
  { title: '首購商品分析', description: '追蹤廣告爆款與帶路雞商品，優化導流落地頁。', href: '/traffic/first-purchase-analysis' },
];

export default function Dashboard() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['sessions', 'users', 'bounce_rate']);

  const labelMap = useMemo(() => {
    const map: Record<string, string> = {
      source: '來源 / 媒介', bounce_rate: '跳出率', conversion: '轉換率'
    };
    metrics.forEach(m => { map[m.id] = m.label; });
    return map;
  }, []);

  const {
    paginatedData, totalCount, currentPage, pageSize, sortConfig, columnFilters, filterBadges,
    handleSort, handleFilter, handlePageChange, handlePageSizeChange, clearAllFilters, removeFilter
  } = useBITable({
    data: trafficData,
    initialPageSize: 25,
    labelMap
  });

  const columns: ColDef[] = [
    { id: 'source', label: '來源 / 媒介', type: 'string', width: 220 },
    { id: 'sessions', label: '進站數 (Sessions)', type: 'numeric', width: 160 },
    { id: 'users', label: '獨立訪客數', type: 'numeric', width: 160 },
    { id: 'bounce_rate', label: '跳出率', type: 'numeric', width: 120 },
    { id: 'conversion', label: '轉換率', type: 'numeric', width: 120 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">流量資料表</h1>
        <p className="mt-2 text-sm text-slate-600">
          全通路獲客漏斗儀表板，即時監測廣告預算花費效率與進站流量的變現能力。
        </p>
      </div>

      <AnalyticsControlBar
        metrics={metrics}
        dimensions={dimensions}
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
        hideTimeGranularity={true}
        singleRowLayout={true}
      />

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
              <p className={`ml-2 flex items-baseline text-sm font-semibold ${card.positive ? 'text-emerald-600' : 'text-rose-600'}`}>{card.change} <span className="ml-1 text-slate-500 font-normal">較上週</span></p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-20">
          <h2 className="text-lg font-semibold text-slate-900">渠道流量屬性總表</h2>
          <div className="flex items-center gap-3">
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Download className="w-4 h-4" /> 匯出 CSV
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/30">
          <FilterBadges filters={filterBadges} onRemove={removeFilter} onClearAll={clearAllFilters} />
        </div>

        <div className="overflow-x-auto relative scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-40 bg-slate-50">
              <tr>
                {columns.map(col => (
                  <ColumnHeader
                    key={col.id} col={col} sortConfig={sortConfig} onSort={handleSort}
                    filter={columnFilters[col.id] || null} onFilter={handleFilter}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedData.map((row) => (
                <tr key={row.source} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-900">{row.source}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 text-right font-mono">{row.sessions}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 text-right font-mono">{row.users}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 text-right font-mono">{row.bounce_rate}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 text-right font-mono">{row.conversion}</td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-sm text-slate-500">無符合篩選條件的渠道數據。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage} pageSize={pageSize} totalCount={totalCount}
          onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <SubpagePreviewCards subpages={subpages} />
    </div>
  );
}
