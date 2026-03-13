import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface PlaceholderPageProps {
    title: string;
    description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    const data = [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 300 },
        { name: 'Mar', value: 300 },
        { name: 'Apr', value: 200 },
        { name: 'May', value: 278 },
        { name: 'Jun', value: 189 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>

            {/* KPI Cards Placeholder */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-4"></div>
                        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                ))}
            </div>

            {/* Charts & Tables Placeholder */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 h-96 flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">趨勢圖表 (Placeholder)</h2>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 h-96 flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">詳細資料 (Placeholder)</h2>
                    <div className="flex-1 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200">
                        <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse mb-4"></div>
                        <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse mb-4"></div>
                        <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse"></div>
                        <span className="mt-4 text-sm font-medium text-slate-500">Table Area Placeholder</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
