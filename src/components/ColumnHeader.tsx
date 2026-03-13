import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Pin, PinOff, GripVertical } from 'lucide-react';

export type FilterOperator = '>' | '<' | '=' | 'between' | 'equals' | 'contains' | 'starts_with' | 'in';

export interface ColFilter {
    operator: FilterOperator;
    value1: string;
    value2: string;
    categories: string[];
}

export interface SortRule {
    key: string;
    direction: 'asc' | 'desc';
}

export interface ColDef {
    id: string;
    label: string;
    type: 'string' | 'numeric' | 'category';
    options?: string[];
    width: number;
}

interface ColumnHeaderProps {
    col: ColDef;
    sortConfig: SortRule[];
    onSort: (key: string, direction: 'asc' | 'desc' | null, multi: boolean) => void;
    filter: ColFilter | null;
    onFilter: (key: string, filter: ColFilter | null) => void;
    isPinned?: boolean;
    onPin?: (key: string) => void;
    leftOffset?: number;
    onDragStart?: (e: React.DragEvent, id: string) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent, targetId: string) => void;
    isDraggable?: boolean;
}

export default function ColumnHeader({
    col, sortConfig, onSort, filter, onFilter, isPinned = false, onPin, leftOffset,
    onDragStart, onDragOver, onDrop, isDraggable = false
}: ColumnHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const thRef = useRef<HTMLTableHeaderCellElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!triggerRef.current || !isOpen) return;
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const menuWidth = 280;
        const vPadding = 8;
        const menuHeight = menuRef.current ? menuRef.current.offsetHeight : 380;

        let top = triggerRect.bottom + 4;
        let left = col.type === 'numeric' ? triggerRect.right - menuWidth : triggerRect.left;

        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - triggerRect.bottom - vPadding;
        const spaceAbove = triggerRect.top - vPadding;

        if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
            top = triggerRect.top - menuHeight - 4;
        }

        const viewportWidth = window.innerWidth;
        if (left + menuWidth > viewportWidth - 10) {
            left = viewportWidth - menuWidth - 10;
        }
        if (left < 10) {
            left = 10;
        }

        setMenuStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${menuWidth}px`,
            zIndex: 1000,
        });
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            const handleUpdate = () => requestAnimationFrame(updatePosition);
            window.addEventListener('scroll', handleUpdate, true);
            window.addEventListener('resize', handleUpdate);
            const tableContainer = thRef.current?.closest('.overflow-x-auto');
            if (tableContainer) tableContainer.addEventListener('scroll', handleUpdate);
            return () => {
                window.removeEventListener('scroll', handleUpdate, true);
                window.removeEventListener('resize', handleUpdate);
                if (tableContainer) tableContainer.removeEventListener('scroll', handleUpdate);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                thRef.current && !thRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const [tempOp, setTempOp] = useState<FilterOperator>(
        filter?.operator || (col.type === 'numeric' ? '>' : col.type === 'string' ? 'contains' : 'in')
    );
    const [tempV1, setTempV1] = useState(filter?.value1 || '');
    const [tempV2, setTempV2] = useState(filter?.value2 || '');
    const [tempCats, setTempCats] = useState<string[]>(filter?.categories || []);

    useEffect(() => {
        if (isOpen) {
            setTempOp(filter?.operator || (col.type === 'numeric' ? '>' : col.type === 'string' ? 'contains' : 'in'));
            setTempV1(filter?.value1 || '');
            setTempV2(filter?.value2 || '');
            setTempCats(filter?.categories || []);
        }
    }, [isOpen, filter, col.id]);

    const handleApply = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFilter(col.id, { operator: tempOp, value1: tempV1, value2: tempV2, categories: tempCats });
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFilter(col.id, null);
        setIsOpen(false);
    };

    const sortIndex = sortConfig.findIndex(r => r.key === col.id);
    const currentSort = sortIndex > -1 ? sortConfig[sortIndex] : null;
    const isSorted = currentSort !== null;
    const isFiltered = filter !== null && filter !== undefined;

    return (
        <th
            scope="col"
            ref={thRef}
            draggable={isDraggable}
            onDragStart={onDragStart ? (e) => onDragStart(e, col.id) : undefined}
            onDragOver={onDragOver}
            onDrop={onDrop ? (e) => onDrop(e, col.id) : undefined}
            className={`relative px-4 py-3.5 ${col.type === 'numeric' ? 'text-right' : 'text-left'} text-sm font-semibold text-slate-900 whitespace-nowrap align-middle border-b border-slate-200 bg-slate-50 transition-shadow ${isPinned ? 'z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : 'z-10'}`}
            style={{
                width: col.width,
                minWidth: col.width,
                maxWidth: col.width,
                position: isPinned ? 'sticky' : 'relative',
                left: isPinned ? (leftOffset || 0) : undefined,
                backgroundColor: '#f8fafc'
            }}
        >
            <div className="flex items-center gap-2">
                {isDraggable && (
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-move shrink-0" />
                )}
                <div
                    ref={triggerRef}
                    className={`flex-1 flex items-center gap-2 cursor-pointer hover:bg-slate-200 p-1.5 -m-1.5 rounded transition-colors select-none ${col.type === 'numeric' ? 'justify-end' : 'justify-start'}`}
                    onClick={(e) => {
                        onSort(col.id, isSorted ? (currentSort.direction === 'asc' ? 'desc' : null) : 'asc', e.shiftKey);
                    }}
                >
                    <span className="truncate">{col.label}</span>
                    <div className="flex items-center gap-1 text-slate-400 shrink-0">
                        {isSorted && (
                            <div className="flex items-center gap-0.5">
                                <span className="text-indigo-600 font-bold mb-[1px]">
                                    {currentSort.direction === 'asc' ? '▲' : '▼'}
                                </span>
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1 rounded-full font-bold">
                                    {sortIndex + 1}
                                    {/* (index + 1) priority */}
                                </span>
                            </div>
                        )}
                        {isFiltered && (
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mr-0.5" />
                        )}
                        <div
                            className="p-1 hover:bg-slate-300 rounded-md transition-colors"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="bg-white border border-slate-200 shadow-2xl rounded-xl p-0 z-[1000] font-normal text-left overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                    style={menuStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">欄位設定</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{col.label}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px] p-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {onPin && (
                            <div className="pb-1 mb-1">
                                <button
                                    onClick={() => { onPin(col.id); setIsOpen(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    {isPinned ? <PinOff className="w-4 h-4 text-slate-400" /> : <Pin className="w-4 h-4 text-slate-400" />}
                                    {isPinned ? '取消固定欄位' : '固定此欄位'}
                                </button>
                            </div>
                        )}
                        <div className="border-t border-slate-50 pt-2 mt-1 mb-2">
                            <p className="text-[11px] font-bold text-slate-400 mb-1 px-3 uppercase tracking-wider">排序</p>
                            <div className="flex flex-col gap-0.5">
                                <button
                                    onClick={(e) => { onSort(col.id, 'asc', e.shiftKey); setIsOpen(false); }}
                                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSorted && currentSort.direction === 'asc' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    升冪排序
                                </button>
                                <button
                                    onClick={(e) => { onSort(col.id, 'desc', e.shiftKey); setIsOpen(false); }}
                                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSorted && currentSort.direction === 'desc' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    降冪排序
                                </button>
                            </div>
                        </div>
                        <div className="border-t border-slate-50 pt-2 mt-1 px-1">
                            <p className="text-[11px] font-bold text-slate-400 mb-2 px-2 uppercase tracking-wider">篩選工具</p>
                            {col.type === 'string' && (
                                <div className="space-y-3 px-2 pb-2">
                                    <select
                                        value={tempOp}
                                        onChange={(e) => setTempOp(e.target.value as FilterOperator)}
                                        className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 bg-white"
                                    >
                                        <option value="equals">等於</option>
                                        <option value="contains">包含</option>
                                        <option value="starts_with">開始於</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="搜尋內容..."
                                        value={tempV1}
                                        onChange={(e) => setTempV1(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700"
                                    />
                                </div>
                            )}
                            {col.type === 'numeric' && (
                                <div className="space-y-3 px-2 pb-2">
                                    <select
                                        value={tempOp}
                                        onChange={(e) => setTempOp(e.target.value as FilterOperator)}
                                        className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 bg-white"
                                    >
                                        <option value=">">大於</option>
                                        <option value="<">小於</option>
                                        <option value="=">等於</option>
                                        <option value="between">介於</option>
                                    </select>
                                    {tempOp === 'between' ? (
                                        <div className="flex items-center gap-2">
                                            <input type="number" placeholder="min" value={tempV1} onChange={(e) => setTempV1(e.target.value)} className="w-1/2 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 text-slate-700 bg-slate-50" />
                                            <span className="text-slate-400 text-xs">-</span>
                                            <input type="number" placeholder="max" value={tempV2} onChange={(e) => setTempV2(e.target.value)} className="w-1/2 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 text-slate-700 bg-slate-50" />
                                        </div>
                                    ) : (
                                        <input
                                            type="number"
                                            placeholder="輸入數值"
                                            value={tempV1}
                                            onChange={(e) => setTempV1(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 text-slate-700 bg-slate-50"
                                        />
                                    )}
                                </div>
                            )}
                            {col.type === 'category' && (
                                <div className="max-h-48 overflow-y-auto space-y-0.5 px-1 pb-1">
                                    {col.options?.map(opt => (
                                        <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={tempCats.includes(opt)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setTempCats([...tempCats, opt]);
                                                    else setTempCats(tempCats.filter(c => c !== opt));
                                                }}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 px-4 py-3 border-t border-slate-100 mt-auto">
                        <button onClick={handleClear} className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">清除篩選</button>
                        <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">取消</button>
                            <button onClick={handleApply} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95">套用</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </th>
    );
}
