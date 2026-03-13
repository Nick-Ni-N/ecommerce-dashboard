import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Search, Trash2, Bookmark, TrendingUp, TrendingDown, Users, UserPlus, UserCheck, AlertTriangle, Check, X, Edit2 } from 'lucide-react';
import AnalyticsControlBar from '../../components/AnalyticsControlBar';
import SubpagePreviewCards from '../../components/SubpagePreviewCards';
import TablePagination from '../../components/TablePagination';
import FilterBadges from '../../components/FilterBadges';
import ColumnHeader, { type ColDef, type ColFilter, type SortRule } from '../../components/ColumnHeader';
import { useBITable } from '../../hooks/useBITable';

// --- Types & Constants ---

interface Order {
  id: string;
  date: string;
  amount: number;
  items: Array<{ productId: string, skuId: string, category: string }>;
  pointsUsed: number;
  pointsDiscount: number;
  couponUsed: number;
  couponDiscount: number;
  isReturn: boolean;
}

interface MemberRawData {
  id: string;
  gender: string;
  age: string;
  tier: string;
  tier_expiry: string;
  points_expiry: string;
  line_binding: string;
  sms_opt_in: string;
  app_push_opt_in: string;
  edm_opt_in: string;
  orders: Order[];
}

const METRIC_GROUPS = [
  {
    label: '會員狀態',
    metrics: [
      { id: 'gender', label: '性別', type: 'category' as const, width: 100 },
      { id: 'age', label: '年齡', type: 'category' as const, width: 100 },
      { id: 'tier', label: '會員階級', type: 'category' as const, width: 130 },
      { id: 'tier_expiry', label: '階級到期日', type: 'string' as const, width: 140 },
      { id: 'points_expiry', label: '積分最近到期日', type: 'string' as const, width: 180 },
      { id: 'line_binding', label: 'Line綁定狀態', type: 'category' as const, width: 130 },
      { id: 'sms_opt_in', label: '簡訊接收意願', type: 'category' as const, width: 130 },
      { id: 'app_push_opt_in', label: 'APP推播意願', type: 'category' as const, width: 130 },
      { id: 'edm_opt_in', label: 'EDM推播意願', type: 'category' as const, width: 130 },
    ]
  },
  {
    label: '會員生命週期',
    metrics: [
      { id: 'first_purchase_date', label: '首購時間', type: 'string' as const, width: 140 },
      { id: 'second_purchase_date', label: '二購時間', type: 'string' as const, width: 140 },
      { id: 'days_between_1st_2nd', label: '首購與二購間隔天數', type: 'numeric' as const, width: 200 },
      { id: 'last_purchase_date', label: '最後一次購買時間', type: 'string' as const, width: 180 },
      { id: 'dormancy_days', label: '休眠天數', type: 'numeric' as const, width: 120 },
    ]
  },
  {
    label: '購買行為',
    metrics: [
      { id: 'purchase_count', label: '購買次數', type: 'numeric' as const, width: 120 },
      { id: 'total_revenue', label: '累積消費金額', type: 'numeric' as const, width: 140 },
      { id: 'aov', label: '平均客單價', type: 'numeric' as const, width: 130 },
      { id: 'avg_repurchase_interval', label: '平均回購天數', type: 'numeric' as const, width: 160 },
      { id: 'latest_repurchase_interval', label: '最近回購天數', type: 'numeric' as const, width: 160 },
      { id: 'predicted_next_purchase_date', label: '預測下次購買日', type: 'string' as const, width: 180 },
      { id: 'churn_risk', label: '流失預警', type: 'category' as const, width: 130 },
    ]
  },
  {
    label: '促銷使用行為',
    metrics: [
      { id: 'points_revenue', label: '使用積分的消費業績', type: 'numeric' as const, width: 180 },
      { id: 'points_count', label: '使用積分次數', type: 'numeric' as const, width: 140 },
      { id: 'points_discount', label: '積分折抵金額', type: 'numeric' as const, width: 140 },
      { id: 'coupon_revenue', label: '使用折價券的消費業績', type: 'numeric' as const, width: 160 },
      { id: 'coupon_count', label: '使用折價券次數', type: 'numeric' as const, width: 140 },
      { id: 'coupon_discount', label: '折價券折抵金額', type: 'numeric' as const, width: 140 },
    ]
  },
  {
    label: '退貨行為',
    metrics: [
      { id: 'return_count', label: '退貨次數', type: 'numeric' as const, width: 120 },
      { id: 'return_amount', label: '退貨總金額', type: 'numeric' as const, width: 140 },
    ]
  }
];

const DEFAULT_VISIBLE_METRICS = [
  'gender', 'tier', 'first_purchase_date', 'last_purchase_date', 'dormancy_days',
  'purchase_count', 'total_revenue', 'aov', 'avg_repurchase_interval', 'latest_repurchase_interval', 'churn_risk'
];

const TODAY = new Date('2026-03-13');

// --- Mock Data ---

const membersRaw: MemberRawData[] = [
  {
    id: 'M10001', gender: '女性', age: '25-34', tier: 'VIP 會員', tier_expiry: '2026-12-31', points_expiry: '2026-06-30',
    line_binding: '已綁定', sms_opt_in: '是', app_push_opt_in: '是', edm_opt_in: '否',
    orders: [
      { id: 'O1', date: '2025-01-10', amount: 3500, items: [{ productId: 'P1', skuId: 'SKU-001', category: '包袋' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 1, couponDiscount: 100, isReturn: false },
      { id: 'O2', date: '2025-03-15', amount: 4200, items: [{ productId: 'P2', skuId: 'SKU-002', category: '服飾' }], pointsUsed: 100, pointsDiscount: 50, couponUsed: 0, couponDiscount: 0, isReturn: false },
      { id: 'O3', date: '2025-06-20', amount: 1500, items: [{ productId: 'P1', skuId: 'SKU-001', category: '包袋' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 0, couponDiscount: 0, isReturn: false },
      { id: 'O4', date: '2025-09-05', amount: 5000, items: [{ productId: 'P3', skuId: 'SKU-003', category: '生活' }], pointsUsed: 200, pointsDiscount: 100, couponUsed: 1, couponDiscount: 200, isReturn: false },
      { id: 'O5', date: '2026-01-12', amount: 2800, items: [{ productId: 'P2', skuId: 'SKU-002', category: '服飾' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 0, couponDiscount: 0, isReturn: false },
    ]
  },
  {
    id: 'M10002', gender: '男性', age: '35-44', tier: '白金會員', tier_expiry: '2026-06-30', points_expiry: '2026-04-15',
    line_binding: '未綁定', sms_opt_in: '否', app_push_opt_in: '是', edm_opt_in: '是',
    orders: [
      { id: 'O6', date: '2025-05-20', amount: 12000, items: [{ productId: 'P4', skuId: 'SKU-004', category: '電子' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 1, couponDiscount: 500, isReturn: false },
      { id: 'O7', date: '2025-11-20', amount: 8000, items: [{ productId: 'P4', skuId: 'SKU-004', category: '電子' }], pointsUsed: 500, pointsDiscount: 250, couponUsed: 0, couponDiscount: 0, isReturn: false },
    ]
  },
  {
    id: 'M10003', gender: '女性', age: '18-24', tier: '一般會員', tier_expiry: '2027-01-01', points_expiry: '2026-12-31',
    line_binding: '已綁定', sms_opt_in: '是', app_push_opt_in: '否', edm_opt_in: '否',
    orders: [
      { id: 'O8', date: '2026-02-10', amount: 1500, items: [{ productId: 'P5', skuId: 'SKU-005', category: '配飾' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 0, couponDiscount: 0, isReturn: false },
    ]
  },
  {
    id: 'M10004', gender: '男性', age: '45-54', tier: 'VIP 會員', tier_expiry: '2026-12-31', points_expiry: '2026-08-15',
    line_binding: '已綁定', sms_opt_in: '是', app_push_opt_in: '是', edm_opt_in: '是',
    orders: [
      { id: 'O9', date: '2025-02-01', amount: 6000, items: [{ productId: 'P6', skuId: 'SKU-006', category: '鞋類' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 0, couponDiscount: 0, isReturn: false },
      { id: 'O10', date: '2025-04-01', amount: 5500, items: [{ productId: 'P6', skuId: 'SKU-006', category: '鞋類' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 0, couponDiscount: 0, isReturn: false },
      { id: 'O11', date: '2025-05-15', amount: 5800, items: [{ productId: 'P1', skuId: 'SKU-001', category: '包袋' }], pointsUsed: 100, pointsDiscount: 50, couponUsed: 0, couponDiscount: 0, isReturn: false },
      { id: 'O12', date: '2026-03-10', amount: 2000, items: [{ productId: 'P2', skuId: 'SKU-002', category: '服飾' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 0, couponDiscount: 0, isReturn: false },
    ]
  },
  {
    id: 'M10005', gender: '女性', age: '25-34', tier: '一般會員', tier_expiry: '2026-09-30', points_expiry: '2026-05-10',
    line_binding: '未綁定', sms_opt_in: '是', app_push_opt_in: '否', edm_opt_in: '是',
    orders: [
      { id: 'O13', date: '2025-08-12', amount: 3200, items: [{ productId: 'P7', skuId: 'SKU-007', category: '居家' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 1, couponDiscount: 150, isReturn: false },
      { id: 'O14', date: '2025-10-10', amount: 3200, items: [{ productId: 'P7', skuId: 'SKU-007', category: '居家' }], pointsUsed: 0, pointsDiscount: 0, couponUsed: 0, couponDiscount: 0, isReturn: true },
    ]
  }
];

// Generate 10k mock members for performance testing
const largeMembersRaw: MemberRawData[] = Array.from({ length: 10000 }, (_, i) => {
  const baseMember = membersRaw[i % membersRaw.length];
  return {
    ...baseMember,
    id: `M${10000 + i}`,
    orders: baseMember.orders.map(o => ({ ...o, id: `${o.id}_${i}` }))
  };
});

// Generate 200+ simulated SKUs and Products
const allCategories = ['包袋', '服飾', '生活', '電子', '配飾', '鞋類', '居家'];
const allProductIds = Array.from({ length: 50 }, (_, i) => `P${i + 1}`);
const allSkuIds = Array.from({ length: 200 }, (_, i) => `SKU-${String(i + 1).padStart(3, '0')}`);

// --- Dimension Meta ---

const DIMENSION_FIELDS = [
  { id: 'category', label: '商品分類', options: allCategories.map(c => ({ id: c, label: c })) },
  { id: 'productId', label: '商品ID', options: allProductIds.map(id => ({ id, label: `商品 ${id}` })) },
  { id: 'skuId', label: 'SKU ID', options: allSkuIds.map(id => ({ id, label: `SKU ${id}` })) },
  { id: 'gender', label: '性別', options: [{ id: '女性', label: '女性' }, { id: '男性', label: '男性' }] },
  { id: 'age', label: '年齡', options: ['18-24', '25-34', '35-44', '45-54', '55+'].map(a => ({ id: a, label: a })) },
  { id: 'tier', label: '會員階級', options: ['VIP 會員', '白金會員', '一般會員'].map(t => ({ id: t, label: t })) },
];

// --- Helper Functions ---

const formatDate = (d: Date | null) => d ? d.toISOString().split('T')[0] : 'NULL';

const calculateMember360 = (member: MemberRawData, filters: Record<string, string[]>) => {
  // Filter core attributes first
  if (filters.gender?.length > 0 && !filters.gender.includes(member.gender)) return null;
  if (filters.age?.length > 0 && !filters.age.includes(member.age)) return null;
  if (filters.tier?.length > 0 && !filters.tier.includes(member.tier)) return null;

  // Level 1: Filter orders based on item-level criteria
  const hasItemFilter = (filters.category?.length > 0 || filters.productId?.length > 0 || filters.skuId?.length > 0);

  const filteredOrders = member.orders.filter(order => {
    if (order.isReturn) return false;
    if (hasItemFilter) {
      return order.items.some(item => {
        const matchCat = filters.category?.length > 0 ? filters.category.includes(item.category) : true;
        const matchPid = filters.productId?.length > 0 ? filters.productId.includes(item.productId) : true;
        const matchSku = filters.skuId?.length > 0 ? filters.skuId.includes(item.skuId) : true;
        return matchCat && matchPid && matchSku;
      });
    }
    return true;
  });

  const returnOrders = member.orders.filter(o => o.isReturn);

  const purchaseCount = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.amount, 0);

  const sortedDates = filteredOrders.map(o => new Date(o.date)).sort((a, b) => a.getTime() - b.getTime());
  const firstPurchaseDate = sortedDates[0] || null;
  const secondPurchaseDate = sortedDates[1] || null;
  const lastPurchaseDate = sortedDates[sortedDates.length - 1] || null;
  const previousPurchaseDate = sortedDates[sortedDates.length - 2] || null;

  const dormancyDays = lastPurchaseDate ? Math.floor((TODAY.getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

  let avgRepurchaseInterval = null;
  let latestRepurchaseInterval = null;
  let predictedNextPurchaseDate = null;

  if (purchaseCount > 1 && firstPurchaseDate && lastPurchaseDate && previousPurchaseDate) {
    avgRepurchaseInterval = Math.floor((lastPurchaseDate.getTime() - firstPurchaseDate.getTime()) / (1000 * 60 * 60 * 24) / (purchaseCount - 1));
    latestRepurchaseInterval = Math.floor((lastPurchaseDate.getTime() - previousPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    predictedNextPurchaseDate = new Date(lastPurchaseDate.getTime() + avgRepurchaseInterval * 24 * 60 * 60 * 1000);
  }

  const daysBetween1st2nd = (firstPurchaseDate && secondPurchaseDate)
    ? Math.floor((secondPurchaseDate.getTime() - firstPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Churn Risk Logic
  let churnRiskText = '';
  let churnRiskColor = '';

  if (purchaseCount === 1) {
    churnRiskText = 'New';
    churnRiskColor = 'bg-slate-100 text-slate-600';
  } else if (purchaseCount > 1 && dormancyDays !== null && latestRepurchaseInterval !== null) {
    if (dormancyDays < latestRepurchaseInterval) {
      churnRiskText = '🟢 綠燈';
      churnRiskColor = 'bg-emerald-50 text-emerald-700';
    } else if (dormancyDays < (latestRepurchaseInterval + 14)) {
      churnRiskText = '🟡 黃燈';
      churnRiskColor = 'bg-amber-50 text-amber-700';
    } else {
      churnRiskText = '🔴 紅燈';
      churnRiskColor = 'bg-rose-50 text-rose-700';
    }
  }

  return {
    id: member.id,
    gender: member.gender,
    age: member.age,
    tier: member.tier,
    tier_expiry: member.tier_expiry,
    points_expiry: member.points_expiry,
    line_binding: member.line_binding,
    sms_opt_in: member.sms_opt_in,
    app_push_opt_in: member.app_push_opt_in,
    edm_opt_in: member.edm_opt_in,

    first_purchase_date: formatDate(firstPurchaseDate),
    second_purchase_date: formatDate(secondPurchaseDate),
    days_between_1st_2nd: daysBetween1st2nd ?? 'NULL',
    last_purchase_date: formatDate(lastPurchaseDate),
    dormancy_days: dormancyDays ?? 'NULL',

    purchase_count: purchaseCount,
    total_revenue: `$` + totalRevenue.toLocaleString(),
    aov: purchaseCount > 0 ? `$` + Math.floor(totalRevenue / purchaseCount).toLocaleString() : 'NULL',
    avg_repurchase_interval: avgRepurchaseInterval ?? 'NULL',
    latest_repurchase_interval: latestRepurchaseInterval ?? 'NULL',
    predicted_next_purchase_date: formatDate(predictedNextPurchaseDate),
    churn_risk: { text: churnRiskText, color: churnRiskColor },

    points_revenue: `$` + filteredOrders.filter(o => o.pointsUsed > 0).reduce((sum, o) => sum + o.amount, 0).toLocaleString(),
    points_count: filteredOrders.filter(o => o.pointsUsed > 0).length,
    points_discount: `$` + filteredOrders.reduce((sum, o) => sum + o.pointsDiscount, 0).toLocaleString(),
    coupon_revenue: `$` + filteredOrders.filter(o => o.couponUsed > 0).reduce((sum, o) => sum + o.amount, 0).toLocaleString(),
    coupon_count: filteredOrders.filter(o => o.couponUsed > 0).length,
    coupon_discount: `$` + filteredOrders.reduce((sum, o) => sum + o.couponDiscount, 0).toLocaleString(),

    return_count: returnOrders.length,
    return_amount: `$` + returnOrders.reduce((sum, o) => sum + o.amount, 0).toLocaleString(),
  };
};

interface SavedView {
  id: string;
  name: string;
  metrics: string[];
  dimensions: Record<string, string[]>;
  columnOrder: string[];
  pinnedColumns: string[];
  sortConfig: SortRule[];
  columnFilters: Record<string, ColFilter>;
}

// --- Main Page Component ---

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Sync helper functions
  const getParam = (key: string) => searchParams.get(key);
  const getArrayParam = (key: string) => searchParams.get(key)?.split(',').filter(Boolean) || [];
  const getJSONParam = (key: string, defaultVal: any) => {
    try {
      const val = searchParams.get(key);
      return val ? JSON.parse(decodeURIComponent(val)) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [dateRangeType, setDateRangeType] = useState(() => getParam('date') || '最近7天');
  const [customStart, setCustomStart] = useState(() => getParam('start') || '2026-03-01');
  const [customEnd, setCustomEnd] = useState(() => getParam('end') || '2026-03-10');

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(() => {
    const fromURL = getArrayParam('metrics');
    return fromURL.length > 0 ? fromURL : DEFAULT_VISIBLE_METRICS;
  });

  const [selectedDimensionsMap, setSelectedDimensionsMap] = useState<Record<string, string[]>>(() => getJSONParam('dims', {}));

  const initialColumnFilters = useMemo(() => getJSONParam('filters', {}), []);
  const initialSortConfig = useMemo(() => getJSONParam('sort', []), []);

  // Table Interaction State
  const [pinnedColumns, setPinnedColumns] = useState<string[]>(['id']);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);

  // Saved Views State
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isSavingView, setIsSavingView] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editViewName, setEditViewName] = useState('');

  // Virtual Scrolling Logic State
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 40 });
  const rowHeight = 62; // Row height + borders/padding approx

  // Derive calculated members based on active dimensions
  const computedData = useMemo(() => {
    return largeMembersRaw
      .map(m => calculateMember360(m, selectedDimensionsMap))
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [selectedDimensionsMap]);

  const labelMap = useMemo(() => {
    const map: Record<string, string> = { id: '會員ID' };
    METRIC_GROUPS.flatMap(g => g.metrics).forEach(m => { map[m.id] = m.label; });
    return map;
  }, []);

  const {
    paginatedData, totalCount, currentPage, pageSize, sortConfig, columnFilters, filterBadges,
    handleSort, handleFilter, handlePageChange, handlePageSizeChange, clearAllFilters, removeFilter,
    setColumnFilters, setSortConfig, sortedData
  } = useBITable({
    data: computedData,
    initialPageSize: 100,
    initialSort: initialSortConfig,
    labelMap
  });

  // Sync state back to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (dateRangeType !== '最近7天') params.set('date', dateRangeType);
    if (dateRangeType === '自訂區間') {
      params.set('start', customStart);
      params.set('end', customEnd);
    }
    if (selectedMetrics.length > 0) params.set('metrics', selectedMetrics.join(','));
    if (Object.keys(selectedDimensionsMap).length > 0) params.set('dims', JSON.stringify(selectedDimensionsMap));
    if (Object.keys(columnFilters).length > 0) params.set('filters', JSON.stringify(columnFilters));
    if (sortConfig.length > 0) params.set('sort', JSON.stringify(sortConfig));
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (pageSize !== 100) params.set('pageSize', pageSize.toString());

    setSearchParams(params, { replace: true });
  }, [dateRangeType, customStart, customEnd, selectedMetrics, selectedDimensionsMap, columnFilters, sortConfig, currentPage, pageSize]);

  // Sync column filters from dashboard state into hook if needed
  useEffect(() => {
    if (Object.keys(initialColumnFilters).length > 0) {
      setColumnFilters(initialColumnFilters);
    }
  }, [initialColumnFilters, setColumnFilters]);

  // Handle virtual scroll range update
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, clientHeight } = containerRef.current;
      const start = Math.floor(scrollTop / rowHeight);
      const end = Math.ceil((scrollTop + clientHeight) / rowHeight);
      const buffer = 5;
      setVisibleRange({
        start: Math.max(0, start - buffer),
        end: Math.min(paginatedData.length, end + buffer)
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial call
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [paginatedData.length, rowHeight]);

  // Reset scroll on page change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPage, pageSize]);

  // Unique ID for dimension filter badges
  const dimFilterBadges = useMemo(() => {
    const badges: any[] = [];
    Object.entries(selectedDimensionsMap).forEach(([fieldId, values]) => {
      if (values.length > 0) {
        const field = DIMENSION_FIELDS.find(f => f.id === fieldId);
        badges.push({
          id: `dim-${fieldId}`,
          label: field?.label || fieldId,
          value: values.map(v => field?.options.find(o => o.id === v)?.label || v).join(', '),
          isDim: true,
          fieldId
        });
      }
    });
    return badges;
  }, [selectedDimensionsMap]);

  const combinedFilterBadges = useMemo(() => [...dimFilterBadges, ...filterBadges], [dimFilterBadges, filterBadges]);

  const handleRemoveCombinedFilter = (id: string) => {
    if (id.startsWith('dim-')) {
      const fieldId = id.replace('dim-', '');
      setSelectedDimensionsMap(prev => ({ ...prev, [fieldId]: [] }));
    } else {
      removeFilter(id);
    }
  };

  const handleClearAllCombined = () => {
    clearAllFilters();
    setSelectedDimensionsMap({});
  };

  // KPI Calculations based on computedData (filtered)
  const kpis = useMemo(() => {
    const total = computedData.length;
    const isNewMembers = computedData.filter((m: any) => m.purchase_count === 1).length;
    const isActiveMembers = computedData.filter((m: any) => m.churn_risk.text === '🟢 綠燈').length;
    const isChurnedMembers = computedData.filter((m: any) => m.churn_risk.text === '🔴 紅燈').length;

    return [
      { label: '總會員數', value: total.toLocaleString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+12%', isUp: true },
      { label: '新增會員數', value: isNewMembers.toLocaleString(), icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+5.4%', isUp: true },
      { label: '活躍會員數', value: isActiveMembers.toLocaleString(), icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-2.1%', isUp: false },
      { label: '流失會員數', value: isChurnedMembers.toLocaleString(), icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', trend: '+0.8%', isUp: false },
    ];
  }, [computedData]);

  // Saved View Methods
  const saveCurrentView = () => {
    if (!newViewName.trim()) return;
    const newView: SavedView = {
      id: Date.now().toString(),
      name: newViewName,
      metrics: [...selectedMetrics],
      dimensions: { ...selectedDimensionsMap },
      columnOrder: [...columnOrder],
      pinnedColumns: [...pinnedColumns],
      sortConfig: [...sortConfig],
      columnFilters: { ...columnFilters }
    };
    setSavedViews(prev => [...prev, newView]);
    setActiveViewId(newView.id);
    setIsSavingView(false);
    setNewViewName('');
  };

  const applyView = (viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (!view) return;
    setSelectedMetrics(view.metrics);
    setSelectedDimensionsMap(view.dimensions);
    setColumnOrder(view.columnOrder);
    setPinnedColumns(view.pinnedColumns);
    setSortConfig(view.sortConfig);
    setColumnFilters(view.columnFilters);
    setActiveViewId(viewId);
  };

  const deleteView = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedViews(prev => prev.filter(v => v.id !== id));
    if (activeViewId === id) setActiveViewId(null);
  };

  const startRename = (e: React.MouseEvent, view: SavedView) => {
    e.stopPropagation();
    setEditingViewId(view.id);
    setEditViewName(view.name);
  };

  const saveRename = () => {
    if (!editViewName.trim() || !editingViewId) return;
    setSavedViews(prev => prev.map(v => v.id === editingViewId ? { ...v, name: editViewName } : v));
    setEditingViewId(null);
  };

  const activeColumns = useMemo(() => {
    let cols: ColDef[] = [
      { id: 'id', label: '會員ID', type: 'string', width: 140 }
    ];

    METRIC_GROUPS.flatMap(g => g.metrics).forEach(m => {
      if (selectedMetrics.includes(m.id)) {
        cols.push({ id: m.id, label: m.label, type: m.type, width: m.width });
      }
    });

    // Apply custom order if exists
    if (columnOrder.length > 0) {
      const orderMap = new Map(columnOrder.map((id, index) => [id, index]));
      cols.sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 1000;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 1000;
        return orderA - orderB;
      });
    }

    // Move pinned columns to the front
    const pinned = cols.filter(c => pinnedColumns.includes(c.id));
    const unpinned = cols.filter(c => !pinnedColumns.includes(c.id));
    return [...pinned, ...unpinned];
  }, [selectedMetrics, pinnedColumns, columnOrder]);

  const togglePin = (id: string) => {
    setPinnedColumns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedColId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetId) return;

    const newOrder = activeColumns.map(c => c.id);
    const oldIndex = newOrder.indexOf(draggedColId);
    const newIndex = newOrder.indexOf(targetId);

    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, draggedColId);

    setColumnOrder(newOrder);
    setDraggedColId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">會員360分析表</h1>
          <p className="mt-2 text-sm text-slate-600">
            整合商品與會員雙維度的動態分析工具。可跨 SKU 篩選並實時重新計算購買週期與價值指標。
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Saved View Selector */}
          <div className="relative group">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm divide-x divide-slate-100 h-[42px]">
              <div className="px-4 py-1.5 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-slate-400" />
                <select
                  className="bg-transparent text-sm font-bold text-slate-700 outline-none pr-6 cursor-pointer"
                  value={activeViewId || ''}
                  onChange={(e) => applyView(e.target.value)}
                >
                  <option value="" disabled>選擇儲存視圖...</option>
                  {savedViews.map(view => (
                    <option key={view.id} value={view.id}>{view.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsSavingView(true)}
                className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
              >
                儲存目前視圖
              </button>
            </div>

            {isSavingView && (
              <>
                <div className="fixed inset-0 z-50 bg-slate-900/10 backdrop-blur-[1px]" onClick={() => setIsSavingView(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-[60] animate-in fade-in zoom-in-95 duration-200">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">儲存新的視圖</h4>
                  <input
                    autoFocus
                    type="text"
                    placeholder="輸入視圖名稱..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 mb-4"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveCurrentView()}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsSavingView(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg">取消</button>
                    <button onClick={saveCurrentView} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md">儲存</button>
                  </div>
                </div>
              </>
            )}

            {/* View List Manager */}
            {savedViews.length > 0 && !activeViewId && (
              <div className="hidden group-hover:block absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-50">
                {savedViews.map(view => (
                  <div key={view.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group/item cursor-pointer" onClick={() => applyView(view.id)}>
                    {editingViewId === view.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          type="text"
                          className="flex-1 border border-indigo-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-100"
                          value={editViewName}
                          onChange={e => setEditViewName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveRename()}
                        />
                        <button onClick={saveRename} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingViewId(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-slate-700 font-medium">{view.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button onClick={(e) => startRename(e, view)} className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => deleteView(e, view.id)} className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
            <Download className="w-4 h-4" />
            匯出數據
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform ${kpi.color}`}>
              <kpi.icon className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  {kpi.isUp ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                  <span className={kpi.isUp ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{kpi.trend}</span>
                  <span className="text-slate-400 font-medium ml-1">vs 上週期</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnalyticsControlBar
        metricGroups={METRIC_GROUPS}
        dimensionFields={DIMENSION_FIELDS}
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
        onRestoreDefaultMetrics={() => setSelectedMetrics(DEFAULT_VISIBLE_METRICS)}
        metricsLabel="欄位選擇器"
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

      {combinedFilterBadges.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md mb-5">
          <div className="px-6 py-4 bg-slate-50/50">
            <FilterBadges filters={combinedFilterBadges} onRemove={handleRemoveCombinedFilter} onClearAll={handleClearAllCombined} />
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
        <div
          ref={containerRef}
          className="overflow-x-auto relative scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent max-h-[800px]"
        >
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-sm shadow-sm">
              <tr>
                {activeColumns.map((col, idx) => {
                  const leftOffset = activeColumns
                    .slice(0, idx)
                    .filter(c => pinnedColumns.includes(c.id))
                    .reduce((sum, c) => sum + (c.width || 0), 0);

                  return (
                    <ColumnHeader
                      key={col.id}
                      col={col}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      filter={columnFilters[col.id] || null}
                      onFilter={handleFilter}
                      isPinned={pinnedColumns.includes(col.id)}
                      onPin={togglePin}
                      leftOffset={leftOffset}
                      isDraggable={true}
                      onDragStart={handleDragStart}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                    />
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleRange.start > 0 && (
                <tr><td colSpan={activeColumns.length} style={{ height: visibleRange.start * rowHeight }} /></tr>
              )}
              {paginatedData.slice(visibleRange.start, visibleRange.end).map((member) => (
                <tr key={member.id} className="hover:bg-indigo-50/30 transition-colors group" style={{ height: rowHeight }}>
                  {activeColumns.map((col, idx) => {
                    const value = (member as any)[col.id];
                    const isPinned = pinnedColumns.includes(col.id);
                    const leftOffset = activeColumns
                      .slice(0, idx)
                      .filter(c => pinnedColumns.includes(c.id))
                      .reduce((sum, c) => sum + (c.width || 0), 0);

                    const cellStyle: React.CSSProperties = {
                      width: col.width,
                      position: isPinned ? 'sticky' : 'relative',
                      left: isPinned ? leftOffset : undefined,
                      zIndex: isPinned ? 20 : 1,
                    };

                    const baseClass = `whitespace-nowrap py-5 px-4 text-sm transition-colors ${isPinned ? 'bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''
                      } ${col.type === 'numeric' ? 'text-right font-bold font-mono text-slate-700' : 'text-left text-slate-600'}`;

                    if (col.id === 'churn_risk') {
                      return (
                        <td key={col.id} className={`${baseClass} text-right`} style={cellStyle}>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black tracking-wider leading-none shadow-sm ${value.color}`}>
                            {value.text}
                          </span>
                        </td>
                      );
                    }

                    if (col.id === 'id') {
                      return (
                        <td key={col.id} className={`${baseClass} font-bold text-slate-900`} style={cellStyle}>
                          {member.id}
                        </td>
                      );
                    }

                    return (
                      <td key={col.id} className={baseClass} style={cellStyle}>
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {visibleRange.end < paginatedData.length && (
                <tr><td colSpan={activeColumns.length} style={{ height: (paginatedData.length - visibleRange.end) * rowHeight }} /></tr>
              )}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={activeColumns.length} className="py-24 text-center bg-slate-50/10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">目前維度或指標篩選下無符合的會員資料。</p>
                      <button onClick={clearAllFilters} className="text-xs font-bold text-indigo-600 hover:underline">清除所有篩選</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} pageSize={pageSize} totalCount={totalCount} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
      </div>

      <SubpagePreviewCards subpages={subpages || []} />
    </div>
  );
}

const subpages = [
  { title: '會員價值分析', description: 'RFM 模型與 LTV (顧客終身價值) 深度追蹤。', href: '/members/value-analysis' },
  { title: '回購與流失', description: '掌握回購週期，及早辨識並挽留高流失風險會員。', href: '/members/retention-churn' },
  { title: '會員分群', description: '依據購買行為切分客群，提供精準行銷名單。', href: '/members/segmentation' },
  { title: '會員互動成效', description: '追蹤 EDM、簡訊開信率與點擊轉換表現。', href: '/members/engagement' },
];
