export const metrics = [
    { id: 'total_spent', label: '總消費金額' },
    { id: 'aov', label: '平均客單價' },
    { id: 'ltv', label: '會員終身價值 LTV' },
    { id: 'order_count', label: '總消費次數' },
    { id: 'avg_repurchase_days', label: '平均回購天數' },
    { id: 'coupon_usage', label: '折價券使用次數' },
    { id: 'points_usage', label: 'Co幣使用次數' },
];

export const dimensions = [
    { id: 'tier_vip', label: 'VIP 會員' },
    { id: 'tier_platinum', label: '白金會員' },
    { id: 'tier_normal', label: '一般會員' },
    { id: 'gender_f', label: '女性' },
    { id: 'gender_m', label: '男性' },
    { id: 'region_north', label: '北部地區' },
    { id: 'region_central', label: '中部地區' },
    { id: 'region_south', label: '南部地區' },
];

export const membersData = [
    {
        id: 'M10001',
        tier: 'VIP 會員', gender: '女性', age: '25-34', region: '台北市', source: 'Facebook', churn_risk: '低流失預警',
        last_purchase: '2026-03-05',
        dormant_days: 5,
        metrics: {
            total_spent: '$12,400', aov: '$1,550', ltv: '$34,000', order_count: '8', avg_repurchase_days: '45天', coupon_usage: '3', return_count: '0', cancel_count: '0', points_usage: '12',
            coupon_revenue: '$2,400', points_revenue: '$800'
        },
        interactions: {
            line_clicks: 12, sms_clicks: 2, edm_clicks: 5, app_clicks: 24, total_orders: 8, revenue: 12400
        }
    },
    {
        id: 'M10002',
        tier: '一般會員', gender: '男性', age: '18-24', region: '新北市', source: 'Google', churn_risk: '高流失預警',
        last_purchase: '2025-12-20',
        dormant_days: 80,
        metrics: {
            total_spent: '$1,200', aov: '$600', ltv: '$1,200', order_count: '2', avg_repurchase_days: '-', coupon_usage: '0', return_count: '1', cancel_count: '0', points_usage: '0',
            coupon_revenue: '$0', points_revenue: '$0'
        },
        interactions: {
            line_clicks: 1, sms_clicks: 0, edm_clicks: 0, app_clicks: 2, total_orders: 2, revenue: 1200
        }
    },
    {
        id: 'M10003',
        tier: '白金會員', gender: '女性', age: '35-44', region: '台中市', source: 'Line', churn_risk: '低流失預警',
        last_purchase: '2026-02-28',
        dormant_days: 10,
        metrics: {
            total_spent: '$45,000', aov: '$3,000', ltv: '$120,000', order_count: '15', avg_repurchase_days: '30天', coupon_usage: '8', return_count: '2', cancel_count: '1', points_usage: '45',
            coupon_revenue: '$8,500', points_revenue: '$3,200'
        },
        interactions: {
            line_clicks: 45, sms_clicks: 5, edm_clicks: 12, app_clicks: 30, total_orders: 15, revenue: 45000
        }
    },
    {
        id: 'M10004',
        tier: '一般會員', gender: '女性', age: '25-34', region: '台南市', source: 'Organic', churn_risk: '低流失預警',
        last_purchase: '2026-01-15',
        dormant_days: 54,
        metrics: {
            total_spent: '$3,200', aov: '$800', ltv: '$8,500', order_count: '4', avg_repurchase_days: '60天', coupon_usage: '1', return_count: '0', cancel_count: '0', points_usage: '2',
            coupon_revenue: '$400', points_revenue: '$100'
        },
        interactions: {
            line_clicks: 8, sms_clicks: 1, edm_clicks: 2, app_clicks: 10, total_orders: 4, revenue: 3200
        }
    },
    {
        id: 'M10005',
        tier: 'VIP 會員', gender: '男性', age: '45-54', region: '高雄市', source: 'Google', churn_risk: '低流失預警',
        last_purchase: '2026-03-08',
        dormant_days: 2,
        metrics: {
            total_spent: '$22,500', aov: '$2,500', ltv: '$48,000', order_count: '9', avg_repurchase_days: '40天', coupon_usage: '4', return_count: '0', cancel_count: '0', points_usage: '21',
            coupon_revenue: '$3,200', points_revenue: '$1,500'
        },
        interactions: {
            line_clicks: 15, sms_clicks: 3, edm_clicks: 4, app_clicks: 18, total_orders: 9, revenue: 22500
        }
    },
    {
        id: 'M10006',
        tier: '白金會員', gender: '女性', age: '25-34', region: '台北市', source: 'Facebook', churn_risk: '中流失預警',
        last_purchase: '2026-02-10',
        dormant_days: 28,
        metrics: {
            total_spent: '$8,900', aov: '$1,780', ltv: '$18,000', order_count: '5', avg_repurchase_days: '50天', coupon_usage: '2', return_count: '0', cancel_count: '0', points_usage: '5',
            coupon_revenue: '$1,200', points_revenue: '$300'
        },
        interactions: {
            line_clicks: 20, sms_clicks: 2, edm_clicks: 8, app_clicks: 12, total_orders: 5, revenue: 8900
        }
    },
    {
        id: 'M10007',
        tier: '一般會員', gender: '女性', age: '35-44', region: '桃園市', source: 'Instagram', churn_risk: '高流失預警',
        last_purchase: '2025-11-05',
        dormant_days: 125,
        metrics: {
            total_spent: '$5,400', aov: '$1,350', ltv: '$5,400', order_count: '4', avg_repurchase_days: '90天', coupon_usage: '1', return_count: '1', cancel_count: '0', points_usage: '0',
            coupon_revenue: '$500', points_revenue: '$0'
        },
        interactions: {
            line_clicks: 5, sms_clicks: 4, edm_clicks: 1, app_clicks: 5, total_orders: 4, revenue: 5400
        }
    },
    {
        id: 'M10008',
        tier: 'VIP 會員', gender: '女性', age: '35-44', region: '台北市', source: 'Google', churn_risk: '低流失預警',
        last_purchase: '2026-03-09',
        dormant_days: 1,
        metrics: {
            total_spent: '$38,200', aov: '$2,388', ltv: '$95,000', order_count: '16', avg_repurchase_days: '25天', coupon_usage: '12', return_count: '1', cancel_count: '0', points_usage: '60',
            coupon_revenue: '$9,200', points_revenue: '$5,400'
        },
        interactions: {
            line_clicks: 50, sms_clicks: 8, edm_clicks: 15, app_clicks: 45, total_orders: 16, revenue: 38200
        }
    }
];
