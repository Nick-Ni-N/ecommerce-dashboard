import { X, User, ExternalLink } from 'lucide-react';

interface Member {
    id: string;
    tier: string;
    gender: string;
    region: string;
    metrics: {
        total_spent: string;
        order_count: string;
        [key: string]: string;
    };
}

interface MemberDrilldownDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    members: Member[];
}

export default function MemberDrilldownDrawer({ isOpen, onClose, title, members }: MemberDrilldownDrawerProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[1000] animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[1001] flex flex-col animate-in slide-in-from-right duration-500 ease-out">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">共 {members.length} 位會員</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    <div className="space-y-4">
                        {members.length > 0 ? (
                            members.map((member) => (
                                <div
                                    key={member.id}
                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    {member.id}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${member.tier === 'VIP 會員' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                        member.tier === '白金會員' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                                                            'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                        }`}>
                                                        {member.tier}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">{member.gender} · {member.region}</p>
                                            </div>
                                        </div>
                                        <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-t border-slate-50">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">總消費金額</p>
                                            <p className="text-sm font-mono font-bold text-slate-700 mt-1">{member.metrics.total_spent}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">總消費次數</p>
                                            <p className="text-sm font-mono font-bold text-slate-700 mt-1">{member.metrics.order_count}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">客單價</p>
                                            <p className="text-sm font-mono font-bold text-slate-700 mt-1">
                                                {member.metrics.aov || `$${(parseFloat(member.metrics.total_spent.replace(/[$, ]/g, '')) / parseInt(member.metrics.order_count || '1')).toFixed(0)}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-400 italic">
                                <p>查無符合條件之會員</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white">
                    <button className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-[0.98]">
                        匯出此名單 (CSV)
                    </button>
                </div>
            </div>
        </>
    );
}
