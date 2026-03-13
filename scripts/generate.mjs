import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, '../src/pages');

const schema = [
    {
        section: "總表",
        dir: "overview",
        pages: [
            { name: "總覽資料表", file: "Dashboard" },
            { name: "營收趨勢", file: "RevenueTrend" },
            { name: "新客 vs 回購", file: "NewVsReturning" },
            { name: "轉換漏斗", file: "ConversionFunnel" },
            { name: "品類結構", file: "CategoryStructure" },
            { name: "獲利監控", file: "Profitability" }
        ]
    },
    {
        section: "會員",
        dir: "members",
        pages: [
            { name: "會員資料表", file: "Dashboard" },
            { name: "會員價值分析", file: "ValueAnalysis" },
            { name: "回購與流失", file: "RetentionChurn" },
            { name: "會員分群", file: "Segmentation" },
            { name: "優惠工具分析", file: "CouponAnalysis" },
            { name: "會員互動成效", file: "Engagement" }
        ]
    },
    {
        section: "商品",
        dir: "products",
        pages: [
            { name: "商品資料表", file: "Dashboard" },
            { name: "SKU營收排行", file: "SkuRevenue" },
            { name: "SKU毛利分析", file: "SkuMargin" },
            { name: "商品轉換率", file: "ConversionRate" },
            { name: "商品搭配分析", file: "AffinityAnalysis" },
            { name: "庫存與退貨", file: "InventoryReturns" }
        ]
    },
    {
        section: "流量",
        dir: "traffic",
        pages: [
            { name: "流量資料表", file: "Dashboard" },
            { name: "渠道成效", file: "ChannelPerformance" },
            { name: "廣告漏斗", file: "AdFunnel" },
            { name: "拉新品質", file: "AcquisitionQuality" },
            { name: "流量含金量", file: "ValuePerVisit" },
            { name: "首購商品分析", file: "FirstPurchaseAnalysis" }
        ]
    },
    {
        section: "洞察",
        dir: "insights",
        pages: [
            { name: "異常指標", file: "Anomalies" },
            { name: "成長機會", file: "GrowthOpportunities" },
            { name: "風險商品", file: "RiskyProducts" },
            { name: "高價值會員", file: "HighValueMembers" }
        ]
    }
];

// Clean old pages dir
if (fs.existsSync(pagesDir)) {
    fs.rmSync(pagesDir, { recursive: true, force: true });
}
fs.mkdirSync(pagesDir, { recursive: true });

// Generate Pages
schema.forEach(sectionGroup => {
    const groupDir = path.join(pagesDir, sectionGroup.dir);
    fs.mkdirSync(groupDir, { recursive: true });

    sectionGroup.pages.forEach(page => {
        const filePath = path.join(groupDir, `${page.file}.tsx`);
        const content = `import PlaceholderPage from '../../components/PlaceholderPage';

export default function ${page.file}() {
  return (
    <PlaceholderPage 
      title="${page.name}" 
      description="這是 ${page.name} 的預設視圖。這些為佔位圖表與指標板塊，待後續接上實際 API 資料與邏輯分析。" 
    />
  );
}
`;
        fs.writeFileSync(filePath, content);
    });
});

console.log('28 Pages generated successfully!');
