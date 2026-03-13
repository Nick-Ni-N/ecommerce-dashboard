import { ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SubpageDefinition {
    title: string;
    description: string;
    href: string;
}

interface SubpagePreviewCardsProps {
    subpages: SubpageDefinition[];
}

export default function SubpagePreviewCards({ subpages }: SubpagePreviewCardsProps) {
    return (
        <div className="mt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">相關深度分析</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {subpages.map((page) => (
                    <NavLink
                        key={page.href}
                        to={page.href}
                        className="group block rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all shadow-sm"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {page.title}
                                </h4>
                                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                                    {page.description}
                                </p>
                            </div>
                            <div className="bg-indigo-50 p-2 rounded-lg ml-4 group-hover:bg-indigo-100 transition-colors">
                                <ArrowRight className="h-4 w-4 text-indigo-600" />
                            </div>
                        </div>
                        <div className="mt-4 h-16 w-full rounded-md bg-slate-50 border border-slate-100 flex items-end px-2 space-x-1 justify-center overflow-hidden">
                            {/* Very tiny visual representation */}
                            {[40, 70, 45, 90, 65, 85, 60, 100].map((h, i) => (
                                <div key={i} className="w-4 bg-indigo-100 rounded-t-sm group-hover:bg-indigo-200 transition-colors" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </NavLink>
                ))}
            </div>
        </div>
    );
}
