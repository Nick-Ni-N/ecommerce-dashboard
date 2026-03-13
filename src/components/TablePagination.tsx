import { ChevronLeft, ChevronRight, ChevronFirst, ChevronLast } from 'lucide-react';

interface TablePaginationProps {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
}

export default function TablePagination({
    currentPage,
    pageSize,
    totalCount,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100]
}: TablePaginationProps) {
    const totalPages = Math.ceil(totalCount / pageSize);
    const startRange = (currentPage - 1) * pageSize + 1;
    const endRange = Math.min(currentPage * pageSize, totalCount);

    if (totalCount === 0) return null;

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">每頁筆數</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="text-sm border border-slate-200 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white text-slate-700"
                    >
                        {pageSizeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
                <div className="text-sm text-slate-500">
                    顯示 <span className="font-medium text-slate-900">{startRange}-{endRange}</span> 筆，共 <span className="font-medium text-slate-900">{totalCount}</span> 筆
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="text-sm text-slate-500 mr-4">
                    第 <span className="font-medium text-slate-900">{currentPage}</span> / {totalPages} 頁
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 transition-colors"
                        title="第一頁"
                    >
                        <ChevronFirst className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 transition-colors"
                        title="上一頁"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex gap-1 mx-2">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`min-w-[32px] h-8 rounded-md text-sm font-medium transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 transition-colors"
                        title="下一頁"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 transition-colors"
                        title="最末頁"
                    >
                        <ChevronLast className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
