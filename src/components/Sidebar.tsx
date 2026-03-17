import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Box, BarChart2, Lightbulb,
    ChevronRight, ChevronDown, Rocket
} from 'lucide-react';

const navigation = [
    {
        name: '總表',
        icon: LayoutDashboard,
        pathPattern: '/overview',
        items: [
            { name: '總覽資料表', href: '/overview/dashboard' },
            { name: '營收趨勢', href: '/overview/revenue-trend' },
            { name: '新客 vs 回購', href: '/overview/new-vs-returning' },
            { name: '轉換漏斗', href: '/overview/conversion-funnel' },
            { name: '品類結構', href: '/overview/category-structure' },
            { name: '獲利監控', href: '/overview/profitability' },
        ],
    },
    {
        name: '會員',
        icon: Users,
        pathPattern: '/members',
        items: [
            { name: '會員資料表', href: '/members/dashboard' },
            { name: '新會員轉換', href: '/members/new-member-conversion' },
            { name: '會員價值分析', href: '/members/value-analysis' },
            { name: '回購與流失', href: '/members/retention-churn' },
            { name: '會員分群', href: '/members/segmentation' },
            { name: '優惠工具分析', href: '/members/coupon-analysis' },
        ],
    },
    {
        name: '商品',
        icon: Box,
        pathPattern: '/products',
        items: [
            { name: '商品資料表', href: '/products/dashboard' },
            { name: 'SKU營收排行', href: '/products/sku-revenue' },
            { name: 'SKU毛利分析', href: '/products/sku-margin' },
            { name: '商品轉換率', href: '/products/conversion-rate' },
            { name: '商品搭配分析', href: '/products/affinity-analysis' },
            { name: '庫存與退貨', href: '/products/inventory-returns' },
        ],
    },
    {
        name: '流量',
        icon: BarChart2,
        pathPattern: '/traffic',
        items: [
            { name: '流量資料表', href: '/traffic/dashboard' },
            { name: '渠道成效', href: '/traffic/channel-performance' },
            { name: '廣告漏斗', href: '/traffic/ad-funnel' },
            { name: '拉新品質', href: '/traffic/acquisition-quality' },
            { name: '流量含金量', href: '/traffic/value-per-visit' },
            { name: '首購商品分析', href: '/traffic/first-purchase-analysis' },
        ],
    },
    {
        name: '洞察',
        icon: Lightbulb,
        pathPattern: '/insights',
        items: [
            { name: '異常指標', href: '/insights/anomalies' },
            { name: '成長機會', href: '/insights/growth-opportunities' },
            { name: '風險商品', href: '/insights/risky-products' },
            { name: '高價值會員', href: '/insights/high-value-members' },
        ],
    },
];

export default function Sidebar() {
    const location = useLocation();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
        const state: Record<string, boolean> = {};
        navigation.forEach(section => {
            // Default to expanded if we are currently deep inside this section
            if (location.pathname.startsWith(section.pathPattern)) {
                state[section.name] = true;
            }
        });
        return state;
    });

    const toggleSection = (name: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    return (
        <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200 shadow-sm z-10">
            <div className="flex h-16 shrink-0 items-center px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-200">
                        <Rocket className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[1.1rem] font-bold text-slate-800 tracking-tight">電商營運分析平台</span>
                </div>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                <nav className="flex-1 space-y-2 px-3">
                    {navigation.map((section) => {
                        const isActiveParent = location.pathname.startsWith(section.pathPattern);
                        const isExpanded = expandedSections[section.name] !== false && (expandedSections[section.name] || isActiveParent);

                        return (
                            <div key={section.name} className="space-y-1">
                                <button
                                    onClick={() => toggleSection(section.name)}
                                    className={`w-full group flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${isActiveParent
                                            ? 'bg-indigo-50/80 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <section.icon
                                            className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActiveParent ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'
                                                }`}
                                            aria-hidden="true"
                                        />
                                        {section.name}
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown className={`h-4 w-4 ${isActiveParent ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    ) : (
                                        <ChevronRight className={`h-4 w-4 ${isActiveParent ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="pl-11 pr-3 space-y-1 pb-1">
                                        {section.items.map((item) => (
                                            <NavLink
                                                key={item.href}
                                                to={item.href}
                                                className={({ isActive }) =>
                                                    `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                    }`
                                                }
                                            >
                                                {item.name}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
            <div className="flex flex-shrink-0 border-t border-slate-200 p-4">
                <div className="group block w-full flex-shrink-0">
                    <div className="flex items-center">
                        <div>
                            <div className="inline-block h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold shadow-sm">
                                JD
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">John Doe</p>
                            <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700">View profile</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
