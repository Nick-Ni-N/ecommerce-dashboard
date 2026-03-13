import { X, Filter, RotateCcw } from 'lucide-react';

interface FilterBadge {
    id: string;
    label: string;
    value: string;
}

interface FilterBadgesProps {
    filters: FilterBadge[];
    onRemove: (id: string) => void;
    onClearAll: () => void;
}

export default function FilterBadges({ filters, onRemove, onClearAll }: FilterBadgesProps) {
    if (filters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-1.5 px-2 py-1 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">篩選</span>
            </div>

            {filters.map((filter) => (
                <div
                    key={filter.id}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full group transition-all hover:border-indigo-300 hover:shadow-sm"
                >
                    <span className="text-[11px] font-bold text-slate-500">{filter.label}</span>
                    <span className="text-[11px] text-slate-300 font-bold">:</span>
                    <span className="text-[11px] font-bold text-indigo-700">{filter.value}</span>
                    <button
                        onClick={() => onRemove(filter.id)}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}

            <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 ml-2 px-3 py-1 text-[11px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all border border-transparent hover:border-rose-100"
            >
                <RotateCcw className="w-3 h-3" />
                清除全部
            </button>
        </div>
    );
}
