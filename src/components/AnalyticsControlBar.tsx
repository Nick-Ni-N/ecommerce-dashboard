import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Filter, ChevronDown, Check, Search, ChevronRight, RotateCcw } from 'lucide-react';

interface Option {
    id: string;
    label: string;
}

interface MetricGroup {
    label: string;
    metrics: Option[];
}

interface DimensionField {
    id: string;
    label: string;
    options: Option[];
}

interface AnalyticsControlBarProps {
    // Flat lists (for basic backwards compatibility)
    metrics?: Option[];
    dimensions?: Option[];

    // Grouped lists (new requirements)
    metricGroups?: MetricGroup[];
    dimensionFields?: DimensionField[];

    selectedMetrics?: string[];
    onMetricsChange?: (metrics: string[]) => void;
    onRestoreDefaultMetrics?: () => void;
    metricsLabel?: string;

    // For two-level dimensions, selectedDimensions would be an object of fieldId -> values[]
    // But to keep it somewhat compatible, we'll handle both or just use an object
    selectedDimensionsMap?: Record<string, string[]>;
    onDimensionsMapChange?: (map: Record<string, string[]>) => void;

    // Old flat dimensions for other pages
    selectedDimensions?: string[];
    onDimensionsChange?: (dimensions: string[]) => void;

    hideTimeGranularity?: boolean;
    singleRowLayout?: boolean;

    // Date Range Props
    dateRangeType?: string;
    onDateRangeTypeChange?: (type: string) => void;
    customStart?: string;
    onCustomStartChange?: (date: string) => void;
    customEnd?: string;
    onCustomEndChange?: (date: string) => void;
}

export default function AnalyticsControlBar({
    metrics: flatMetrics,
    dimensions: flatDimensions,
    metricGroups,
    dimensionFields,
    selectedMetrics: externalSelectedMetrics,
    onMetricsChange,
    onRestoreDefaultMetrics,
    metricsLabel,
    selectedDimensionsMap = {},
    onDimensionsMapChange,
    selectedDimensions: externalSelectedDimensions,
    onDimensionsChange,
    hideTimeGranularity = false,
    singleRowLayout = false,
    dateRangeType: externalDateRangeType = '最近7天',
    onDateRangeTypeChange,
    customStart: externalCustomStart = '2026-03-01',
    onCustomStartChange,
    customEnd: externalCustomEnd = '2026-03-10',
    onCustomEndChange
}: AnalyticsControlBarProps) {
    const [tempStart, setTempStart] = useState(externalCustomStart);
    const [tempEnd, setTempEnd] = useState(externalCustomEnd);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [timeUnit, setTimeUnit] = useState('日');

    const [isMetricsOpen, setIsMetricsOpen] = useState(false);
    const [isDimensionsOpen, setIsDimensionsOpen] = useState(false);
    const [activeDimField, setActiveDimField] = useState<string | null>(null);
    const [dimSearchTerm, setDimSearchTerm] = useState('');

    const dateTriggerRef = useRef<HTMLDivElement>(null);
    const metricsTriggerRef = useRef<HTMLDivElement>(null);
    const dimensionsTriggerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const selectedMetrics = externalSelectedMetrics || [];
    const selectedDimensions = externalSelectedDimensions || [];
    const dateRangeType = externalDateRangeType;
    const customStart = externalCustomStart;
    const customEnd = externalCustomEnd;

    const closeAll = () => {
        setIsDateOpen(false);
        setIsMetricsOpen(false);
        setIsDimensionsOpen(false);
        setActiveDimField(null);
        setDimSearchTerm('');
    };

    const updatePosition = (trigger: HTMLElement | null, width: number, height: number = 300) => {
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const padding = 10;
        const gap = 4;

        let top = rect.bottom + gap;
        let left = rect.left;

        // Collision detection vertical
        if (top + height > viewportHeight - padding && rect.top > height + padding) {
            top = rect.top - height - gap;
        }

        // Collision detection horizontal
        if (left + width > viewportWidth - padding) {
            left = viewportWidth - width - padding;
        }
        if (left < padding) left = padding;

        setDropdownStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            zIndex: 1000
        });
    };

    useEffect(() => {
        const handleUpdate = () => {
            if (isDateOpen) updatePosition(dateTriggerRef.current, 240, 280);
            if (isMetricsOpen) updatePosition(metricsTriggerRef.current, 320, 500);
            if (isDimensionsOpen) updatePosition(dimensionsTriggerRef.current, 240, 350);
        };

        if (isDateOpen || isMetricsOpen || isDimensionsOpen) {
            handleUpdate();
            window.addEventListener('scroll', handleUpdate, true);
            window.addEventListener('resize', handleUpdate);
            return () => {
                window.removeEventListener('scroll', handleUpdate, true);
                window.removeEventListener('resize', handleUpdate);
            };
        }
    }, [isDateOpen, isMetricsOpen, isDimensionsOpen]);

    const getDateDisplayText = () => dateRangeType === '自訂區間' ? `${customStart} - ${customEnd}` : dateRangeType;

    const getMetricsDisplayText = () => {
        if (selectedMetrics.length === 0) return metricsLabel || '選擇指標...';
        return `${metricsLabel || '指標'} (${selectedMetrics.length})`;
    };

    const getDimensionsDisplayText = () => {
        const totalSelected = Object.values(selectedDimensionsMap).reduce((acc, val) => acc + val.length, 0);
        if (totalSelected === 0 && selectedDimensions.length === 0) return '維度篩選...';
        if (totalSelected > 0) return `維度 (${totalSelected})`;
        if (selectedDimensions.length > 2) return `維度 (${selectedDimensions.length})`;
        return selectedDimensions.map(id => flatDimensions?.find(d => d.id === id)?.label).filter(Boolean).join(', ');
    };

    const renderDateRange = () => (
        <div className="relative" ref={dateTriggerRef}>
            <button
                onClick={() => { const wasOpen = isDateOpen; closeAll(); setIsDateOpen(!wasOpen); }}
                className="flex items-center justify-between min-w-[240px] border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium h-[40px]"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{getDateDisplayText()}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </button>
            {isDateOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-40" onClick={closeAll}></div>
                    <div
                        className="bg-white border border-slate-200 shadow-xl rounded-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150"
                        style={dropdownStyle}
                    >
                        <div className="flex flex-col gap-1">
                            {['今日', '昨日', '最近7天', '最近30天', '本月', '上月'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => { onDateRangeTypeChange?.(opt); closeAll(); }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${dateRangeType === opt ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                            <div className="border-t border-slate-100 my-1 pt-1">
                                <button
                                    onClick={() => onDateRangeTypeChange?.('自訂區間')}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${dateRangeType === '自訂區間' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    自訂區間
                                </button>
                                {dateRangeType === '自訂區間' && (
                                    <div className="mt-2 p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">開始日期</label>
                                            <input
                                                type="date"
                                                value={tempStart}
                                                onChange={(e) => setTempStart(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">結束日期</label>
                                            <input
                                                type="date"
                                                value={tempEnd}
                                                onChange={(e) => setTempEnd(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={() => { setTempStart(customStart); setTempEnd(customEnd); onDateRangeTypeChange?.('最近7天'); closeAll(); }}
                                                className="flex-1 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                                            >
                                                取消
                                            </button>
                                            <button
                                                onClick={() => { onCustomStartChange?.(tempStart); onCustomEndChange?.(tempEnd); closeAll(); }}
                                                className="flex-1 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                                            >
                                                套用
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );

    const renderMetricSelector = () => (
        <div className="relative" ref={metricsTriggerRef}>
            <button
                onClick={() => { const wasOpen = isMetricsOpen; closeAll(); setIsMetricsOpen(!wasOpen); }}
                className="flex items-center justify-between min-w-[180px] border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium h-[40px]"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Filter className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{getMetricsDisplayText()}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </button>

            {isMetricsOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-40" onClick={closeAll}></div>
                    <div
                        className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
                        style={dropdownStyle}
                    >
                        <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                            <h3 className="font-bold text-slate-900 text-sm">{metricsLabel || '選擇顯示指標'}</h3>
                            {onRestoreDefaultMetrics && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRestoreDefaultMetrics(); }}
                                    className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                                >
                                    <RotateCcw className="w-3 h-3" /> 恢復預設
                                </button>
                            )}
                        </div>
                        <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {metricGroups ? (
                                metricGroups.map(group => (
                                    <div key={group.label} className="mb-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 pl-1 flex items-center gap-2">
                                            <span className="w-1 h-3 bg-slate-200 rounded-full"></span>
                                            {group.label}
                                        </p>
                                        <div className="grid grid-cols-1 gap-0.5">
                                            {group.metrics.map(m => {
                                                const isSelected = selectedMetrics.includes(m.id);
                                                return (
                                                    <label
                                                        key={m.id}
                                                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => onMetricsChange?.(isSelected ? selectedMetrics.filter(id => id !== m.id) : [...selectedMetrics, m.id])}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                        />
                                                        <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-800'}`}>{m.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="space-y-1">
                                    {flatMetrics?.map(m => {
                                        const isSelected = selectedMetrics.includes(m.id);
                                        return (
                                            <label key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => onMetricsChange?.(isSelected ? selectedMetrics.filter(id => id !== m.id) : [...selectedMetrics, m.id])}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                />
                                                <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-800'}`}>{m.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );

    const renderDimensionSelector = () => (
        <div className="relative" ref={dimensionsTriggerRef}>
            <button
                onClick={() => { const wasOpen = isDimensionsOpen; closeAll(); setIsDimensionsOpen(!wasOpen); }}
                className="flex items-center justify-between min-w-[180px] border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium h-[40px]"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Filter className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{getDimensionsDisplayText()}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </button>

            {isDimensionsOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-40" onClick={closeAll}></div>
                    <div
                        className="bg-white border border-slate-200 shadow-2xl rounded-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150"
                        style={dropdownStyle}
                    >
                        {dimensionFields ? (
                            <div className="space-y-1">
                                {dimensionFields.map(field => (
                                    <button
                                        key={field.id}
                                        onClick={() => { setActiveDimField(field.id); setDimSearchTerm(''); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors ${activeDimField === field.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <span className="truncate">{field.label}</span>
                                        <div className="flex items-center gap-1.5">
                                            {selectedDimensionsMap[field.id]?.length > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">{selectedDimensionsMap[field.id].length}</span>}
                                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                                {flatDimensions?.map(d => {
                                    const isSelected = selectedDimensions.includes(d.id);
                                    return (
                                        <button key={d.id} onClick={() => onDimensionsChange?.(isSelected ? selectedDimensions.filter(id => id !== d.id) : [...selectedDimensions, d.id])} className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-700">
                                            <span className={isSelected ? 'font-bold text-indigo-700' : ''}>{d.label}</span>
                                            {isSelected && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Value Selector (Level 2) - Kept simple inside portal container or ideally also portal but keep same flow */}
                        {activeDimField && dimensionFields && (
                            <div className="absolute top-0 left-full ml-2 w-[280px] bg-white border border-slate-200 shadow-2xl rounded-xl p-3 z-[1010] animate-in fade-in slide-in-from-left-2 duration-200">
                                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 mb-3 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                                    <Search className="h-3.5 w-3.5 text-slate-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder={`搜尋 ${dimensionFields.find(f => f.id === activeDimField)?.label}...`}
                                        className="bg-transparent text-sm w-full outline-none text-slate-700"
                                        value={dimSearchTerm}
                                        onChange={(e) => setDimSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-0.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                    {dimensionFields.find(f => f.id === activeDimField)?.options
                                        .filter(opt => opt.label.toLowerCase().includes(dimSearchTerm.toLowerCase()) || opt.id.toLowerCase().includes(dimSearchTerm.toLowerCase()))
                                        .map(opt => {
                                            const currentValues = selectedDimensionsMap[activeDimField] || [];
                                            const isSelected = currentValues.includes(opt.id);
                                            return (
                                                <label key={opt.id} className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const newValues = e.target.checked ? [...currentValues, opt.id] : currentValues.filter(v => v !== opt.id);
                                                            onDimensionsMapChange?.({ ...selectedDimensionsMap, [activeDimField]: newValues });
                                                        }}
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                    />
                                                    <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-800'}`}>{opt.label}</span>
                                                </label>
                                            );
                                        })}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <button onClick={() => onDimensionsMapChange?.({ ...selectedDimensionsMap, [activeDimField]: [] })} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest">清除此維度</button>
                                    <button onClick={() => setActiveDimField(null)} className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-all active:scale-95">確定</button>
                                </div>
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}
        </div>
    );

    const containerStyle = singleRowLayout
        ? "flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative z-40"
        : "flex flex-col gap-5 bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative z-40";

    return (
        <div className={containerStyle}>
            <div className="flex flex-wrap items-center gap-4">
                {renderDateRange()}
                {!hideTimeGranularity && (
                    <div className="flex items-center p-1 border border-slate-200 rounded-lg bg-slate-50 w-[170px] shrink-0">
                        <Clock className="h-3.5 w-3.5 text-slate-400 ml-1.5 mr-1 shrink-0" />
                        {['日', '週', '月', '季', '年'].map((unit) => (
                            <button key={unit} onClick={() => setTimeUnit(unit)} className={`flex-1 text-center py-1 text-xs font-medium rounded-md transition-colors ${timeUnit === unit ? 'bg-white shadow-sm ring-1 ring-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>{unit}</button>
                        ))}
                    </div>
                )}
                {!singleRowLayout && <div className="h-8 w-px bg-slate-100 hidden sm:block mx-1"></div>}
                {renderMetricSelector()}
                {renderDimensionSelector()}
            </div>
        </div>
    );
}
