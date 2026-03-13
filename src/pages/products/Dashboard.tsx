import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Box, Tag, ShoppingCart, TrendingUp, Download } from 'lucide-react';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import SubpagePreviewCards from '../../components/SubpagePreviewCards';
import TablePagination from '../../components/TablePagination';
import FilterBadges from '../../components/FilterBadges';
import ColumnHeader, { type ColDef } from '../../components/ColumnHeader';
import { useBITable } from '../../hooks/useBITable';

const metrics = [
  { id: 'sku_revenue', label: '商品總營收' },
  { id: 'sold', label: '售出件數' },
  { id: 'refund_rate', label: '退貨率' },
  { id: 'stock_turnover', label: '庫存周轉天數' },
];

const dimensions = [
  { id: 'category', label: '主分類' },
  { id: 'brand', label: '品牌' },
  { id: 'price_tier', label: '價格帶' },
];

const kpis = [
  { name: '動銷 SKU 數', value: '1,245', change: '+5.4%', icon: Box, positive: true },
  { name: '平均銷售件數', value: '3.2 件', change: '+1.1%', icon: ShoppingCart, positive: true },
  { name: '整體毛利率', value: '42.8%', change: '-0.5%', icon: TrendingUp, positive: false },
  { name: '平均退貨率', value: '4.2%', change: '-1.2%', icon: Tag, positive: true },
];

const productsData = [
  { sku: 'SKU-A001-BLK', name: '極簡都會防潑水後背包', category: '包袋', sku_revenue: '$14,200', sold: 142, margin: '48%' },
  { sku: 'SKU-B024-WHT', name: '純棉重磅素色短T', category: '服飾', sku_revenue: '$12,500', sold: 500, margin: '35%' },
  { sku: 'SKU-C109-SLV', name: '鈦合金便攜保溫瓶', category: '生活', sku_revenue: '$9,800', sold: 98, margin: '52%' },
  { sku: 'SKU-A005-NVY', name: '大容量旅行健身提袋', category: '包袋', sku_revenue: '$8,400', sold: 70, margin: '45%' },
  { sku: 'SKU-B012-GRY', name: '科技羊毛混紡休閒外套', category: '服飾', sku_revenue: '$7,200', sold: 36, margin: '38%' },
  // More mock data for pagination simulation
  { sku: 'SKU-D501-NAV', name: '質感修身休閒西裝褲', category: '服飾', sku_revenue: '$6,800', sold: 45, margin: '41%' },
  { sku: 'SKU-E202-GLD', name: '極簡金屬框太陽眼鏡', category: '配飾', sku_revenue: '$5,500', sold: 110, margin: '58%' },
  { sku: 'SKU-F303-BRW', name: '頂級牛皮商務後背包', category: '包袋', sku_revenue: '$18,900', sold: 63, margin: '55%' },
  { sku: 'SKU-G404-WHT', name: '高透氣運動慢跑鞋', category: '鞋類', sku_revenue: '$11,200', sold: 280, margin: '32%' },
  { sku: 'SKU-H505-BLK', name: '多功能數位收納包', category: '電子', sku_revenue: '$3,400', sold: 170, margin: '46%' },
];

const subpages = [
  { title: 'SKU 營收排行', description: '追蹤 Top 100 暢銷商品與滯銷品名單。', href: '/products/sku-revenue' },
  { title: 'SKU 毛利分析', description: '監控各別商品的真實獲利能力與折讓空間。', href: '/products/sku-margin' },
  { title: '商品轉換率', description: '分析商品頁瀏覽至加入購物車的轉換表現。', href: '/products/conversion-rate' },
  { title: '商品搭配分析', description: '購物車關聯分析 (Market Basket)，找出最佳加購組合。', href: '/products/affinity-analysis' },
  { title: '庫存與退貨', description: '監測庫存健康指標與高退貨率商品瑕疵。', href: '/products/inventory-returns' },
];

export default function Dashboard() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['sku_revenue', 'sold']);

  const labelMap = useMemo(() => {
    const map: Record<string, string> = {
      name: '商品名稱', sku: 'SKU', category: '分類', margin: '毛利率'
    };
    metrics.forEach(m => { map[m.id] = m.label; });
    return map;
  }, []);

  const {
    paginatedData, totalCount, currentPage, pageSize, sortConfig, columnFilters, filterBadges,
    handleSort, handleFilter, handlePageChange, handlePageSizeChange, clearAllFilters, removeFilter
  } = useBITable({
    data: productsData,
    initialPageSize: 25,
    labelMap,
    getStringValue: (item, key) => {
      if (key === 'name_sku') return `${item.name} ${item.sku}`;
      return (item as any)[key] || '';
    }
  });

  const columns: ColDef[] = [
    { id: 'name', label: '商品名稱 (SKU)', type: 'string', width: 280 },
    { id: 'category', label: '分類', type: 'category', options: ['包袋', '服飾', '生活', '鞋類', '電子', '配飾'], width: 120 },
    { id: 'sku_revenue', label: '商品營收', type: 'numeric', width: 150 },
    { id: 'sold', label: '售出件數', type: 'numeric', width: 120 },
    { id: 'margin', label: '毛利率', type: 'numeric', width: 120 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">商品資料表</h1>
        <p className="mt-2 text-sm text-slate-600">
          全盤掌握商品生命週期與銷售動能，從毛利結構到搭配銷售潛能一目了然。
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
          <h2 className="text-lg font-semibold text-slate-900">熱銷商品排行總表</h2>
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
                <tr key={row.sku} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-4 text-sm flex flex-col">
                    <span className="font-medium text-slate-900 truncate max-w-[240px]">{row.name}</span>
                    <span className="text-xs text-slate-500 font-mono mt-0.5">{row.sku}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">{row.category}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 text-right font-mono">{row.sku_revenue}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 text-right font-mono">{row.sold}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 text-right font-mono">{row.margin}</td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-sm text-slate-500">無符合篩選條件的商品。</td>
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
