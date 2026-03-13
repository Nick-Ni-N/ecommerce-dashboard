import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Bug, TrendingDown, Thermometer, Download } from 'lucide-react';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import SubpagePreviewCards from '../../components/SubpagePreviewCards';
import TablePagination from '../../components/TablePagination';
import FilterBadges from '../../components/FilterBadges';
import ColumnHeader, { type ColDef } from '../../components/ColumnHeader';
import { useBITable } from '../../hooks/useBITable';

const metrics = [
  { id: 'anomaly_score', label: '警報嚴重分數' },
  { id: 'drop_rate', label: '跌幅比例' },
  { id: 'impact_revenue', label: '預估營收流失' },
];

const dimensions = [
  { id: 'anomaly_type', label: '異常類型' },
  { id: 'system_module', label: '影響模組' },
];

const kpis = [
  { name: '未處理高危警報', value: '3 筆', change: '+1', icon: AlertTriangle, positive: false },
  { name: '支付失敗率 spike', value: '5.2%', change: '+3.1%', icon: Bug, positive: false },
  { name: '核心商品斷貨預估', value: '14 項', change: '+5', icon: Thermometer, positive: false },
  { name: '異常流量跌幅', value: '-12.4%', change: '-4.2%', icon: TrendingDown, positive: false },
];

const anomaliesData = [
  { id: 'ERR-091', severity: 'High', type: '系統異常', description: '綠界金流回傳逾時比例激增 (單時內 > 5%)', time: '10 mins ago', status: '調查中' },
  { id: 'BIZ-402', severity: 'High', type: '業務異常', description: '主推商品 (SKU-A001) 轉換率連續 4 小時跌破 0.5%', time: '1 hour ago', status: '未處理' },
  { id: 'BIZ-403', severity: 'Medium', type: '庫存警告', description: '暢銷品 (SKU-C109) 預計 3 天內完全斷貨', time: '3 hours ago', status: '通知採購' },
  { id: 'TRA-105', severity: 'Medium', type: '流量異常', description: 'FB 廣告活動 [AW23_Sale] 點擊率突降 40%', time: '8 hours ago', status: '已轉交代理商' },
  { id: 'SYS-224', severity: 'Low', type: '系統異常', description: '會員登入 API 延遲超過 2000ms', time: '1 day ago', status: '已修復' },
];

const subpages = [
  { title: '成長機會', description: '基於機器學習推薦的有潛力爆款商品與藍海客群。', href: '/insights/growth-opportunities' },
  { title: '風險商品', description: '即將斷貨、退貨率激增或客訴頻繁的高風險商品名單。', href: '/insights/risky-products' },
  { title: '高價值會員', description: '有流失風險的 VVIP 客戶名單與專屬挽回建議清單。', href: '/insights/high-value-members' },
];

export default function Anomalies() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['anomaly_score', 'drop_rate']);

  const labelMap = useMemo(() => ({
    severity: '嚴重程度', type: '異常類型', description: '異常描述', time: '發生時間', status: '處理進度'
  }), []);

  const {
    paginatedData, totalCount, currentPage, pageSize, sortConfig, columnFilters, filterBadges,
    handleSort, handleFilter, handlePageChange, handlePageSizeChange, clearAllFilters, removeFilter
  } = useBITable({
    data: anomaliesData,
    initialPageSize: 25,
    labelMap
  });

  const columns: ColDef[] = [
    { id: 'severity', label: '警報標籤', type: 'category', options: ['High', 'Medium', 'Low'], width: 140 },
    { id: 'type', label: '類型', type: 'category', options: ['系統異常', '業務異常', '庫存警告', '流量異常'], width: 120 },
    { id: 'description', label: '異常描述', type: 'string', width: 400 },
    { id: 'time', label: '發生時間', type: 'string', width: 140 },
    { id: 'status', label: '處理進度', type: 'category', options: ['調查中', '未處理', '通知採購', '已轉交代理商', '已修復'], width: 140 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">異常指標</h1>
        <p className="mt-2 text-sm text-slate-600">
          全自動監測電商營運數據，智慧揪出跳水轉換率、阻斷支付等重災異常，縮短止損反應時間。
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
          <div key={card.name} className="overflow-hidden rounded-xl bg-rose-50 p-6 shadow-sm border border-rose-100 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-800">{card.name}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-rose-950">{card.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <card.icon className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {card.positive ? <ArrowDownRight className="h-4 w-4 text-emerald-600" /> : <ArrowUpRight className="h-4 w-4 text-rose-600" />}
              <p className={`ml-2 flex items-baseline text-sm font-semibold ${card.positive ? 'text-emerald-700' : 'text-rose-700'}`}>{card.change} <span className="ml-1 text-rose-600/70 font-normal">較昨日</span></p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-20">
          <h2 className="text-lg font-semibold text-slate-900">即時警報監控台</h2>
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
                <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="whitespace-nowrap px-4 py-4 text-sm flex items-center">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${row.severity === 'High' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : row.severity === 'Medium' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-indigo-50 text-indigo-700 ring-indigo-600/20'}`}>
                      {row.severity}
                    </span>
                    <span className="ml-2 text-xs text-slate-500 font-mono">{row.id}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">{row.type}</td>
                  <td className="px-4 py-4 text-sm text-slate-600 min-w-[300px]">{row.description}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">{row.time}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-sm text-slate-500">無符合條件的警報紀錄。</td>
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
