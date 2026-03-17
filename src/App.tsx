import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// 總表
import OverviewDashboard from './pages/overview/Dashboard';
import RevenueTrend from './pages/overview/RevenueTrend';
import NewVsReturning from './pages/overview/NewVsReturning';
import ConversionFunnel from './pages/overview/ConversionFunnel';
import CategoryStructure from './pages/overview/CategoryStructure';
import Profitability from './pages/overview/Profitability';

// 會員
import MembersDashboard from './pages/members/Dashboard';
import NewMemberConversion from './pages/members/NewMemberConversion';
import ValueAnalysis from './pages/members/ValueAnalysis';
import RetentionChurn from './pages/members/RetentionChurn';
import Segmentation from './pages/members/Segmentation';
import CouponAnalysis from './pages/members/CouponAnalysis';
import Engagement from './pages/members/Engagement';

// 商品
import ProductsDashboard from './pages/products/Dashboard';
import SkuRevenue from './pages/products/SkuRevenue';
import SkuMargin from './pages/products/SkuMargin';
import ConversionRate from './pages/products/ConversionRate';
import AffinityAnalysis from './pages/products/AffinityAnalysis';
import InventoryReturns from './pages/products/InventoryReturns';

// 流量
import TrafficDashboard from './pages/traffic/Dashboard';
import ChannelPerformance from './pages/traffic/ChannelPerformance';
import AdFunnel from './pages/traffic/AdFunnel';
import AcquisitionQuality from './pages/traffic/AcquisitionQuality';
import ValuePerVisit from './pages/traffic/ValuePerVisit';
import FirstPurchaseAnalysis from './pages/traffic/FirstPurchaseAnalysis';

// 洞察
import Anomalies from './pages/insights/Anomalies';
import GrowthOpportunities from './pages/insights/GrowthOpportunities';
import RiskyProducts from './pages/insights/RiskyProducts';
import HighValueMembers from './pages/insights/HighValueMembers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview/dashboard" replace />} />

          <Route path="overview">
            <Route path="dashboard" element={<OverviewDashboard />} />
            <Route path="revenue-trend" element={<RevenueTrend />} />
            <Route path="new-vs-returning" element={<NewVsReturning />} />
            <Route path="conversion-funnel" element={<ConversionFunnel />} />
            <Route path="category-structure" element={<CategoryStructure />} />
            <Route path="profitability" element={<Profitability />} />
          </Route>

          <Route path="members">
            <Route path="dashboard" element={<MembersDashboard />} />
            <Route path="new-member-conversion" element={<NewMemberConversion />} />
            <Route path="value-analysis" element={<ValueAnalysis />} />
            <Route path="retention-churn" element={<RetentionChurn />} />
            <Route path="segmentation" element={<Segmentation />} />
            <Route path="coupon-analysis" element={<CouponAnalysis />} />
            <Route path="engagement" element={<Engagement />} />
          </Route>

          <Route path="products">
            <Route path="dashboard" element={<ProductsDashboard />} />
            <Route path="sku-revenue" element={<SkuRevenue />} />
            <Route path="sku-margin" element={<SkuMargin />} />
            <Route path="conversion-rate" element={<ConversionRate />} />
            <Route path="affinity-analysis" element={<AffinityAnalysis />} />
            <Route path="inventory-returns" element={<InventoryReturns />} />
          </Route>

          <Route path="traffic">
            <Route path="dashboard" element={<TrafficDashboard />} />
            <Route path="channel-performance" element={<ChannelPerformance />} />
            <Route path="ad-funnel" element={<AdFunnel />} />
            <Route path="acquisition-quality" element={<AcquisitionQuality />} />
            <Route path="value-per-visit" element={<ValuePerVisit />} />
            <Route path="first-purchase-analysis" element={<FirstPurchaseAnalysis />} />
          </Route>

          <Route path="insights">
            <Route path="anomalies" element={<Anomalies />} />
            <Route path="growth-opportunities" element={<GrowthOpportunities />} />
            <Route path="risky-products" element={<RiskyProducts />} />
            <Route path="high-value-members" element={<HighValueMembers />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
