import { useState, useMemo } from 'react';

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

interface UseBITableOptions<T> {
    data: T[];
    initialPageSize?: number;
    initialSort?: SortRule[];
    getNumericValue?: (item: T, key: string) => number;
    getStringValue?: (item: T, key: string) => string;
    getCategoryValue?: (item: T, key: string) => string;
    labelMap?: Record<string, string>;
}

export function useBITable<T>({
    data,
    initialPageSize = 25,
    initialSort = [],
    getNumericValue = (item, key) => {
        const raw = (item as any)[key] !== undefined ? (item as any)[key] : (item as any).metrics?.[key];
        if (raw === undefined || raw === null || raw === '') return 0;
        if (typeof raw === 'number') return raw;
        const parsed = parseFloat(String(raw).replace(/[$,%次天 ]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    },
    getStringValue = (item, key) => {
        const val = (item as any)[key] !== undefined ? (item as any)[key] : (item as any).metrics?.[key];
        return val !== undefined && val !== null ? String(val) : '';
    },
    getCategoryValue = (item, key) => {
        const val = (item as any)[key] !== undefined ? (item as any)[key] : (item as any).metrics?.[key];
        return val !== undefined && val !== null ? String(val) : '';
    },
    labelMap = {}
}: UseBITableOptions<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [sortConfig, setSortConfig] = useState<SortRule[]>(initialSort);
    const [columnFilters, setColumnFilters] = useState<Record<string, ColFilter>>({});

    // 1. Filtering
    const filteredData = useMemo(() => {
        return data.filter(item => {
            for (const [key, filter] of Object.entries(columnFilters)) {
                if (!filter) continue;

                // Numeric checking
                if (['>', '<', '=', 'between'].includes(filter.operator)) {
                    const val = getNumericValue(item, key);
                    const v1 = parseFloat(filter.value1) || 0;
                    const v2 = parseFloat(filter.value2) || 0;

                    if (filter.operator === '>') { if (!(val > v1)) return false; }
                    else if (filter.operator === '<') { if (!(val < v1)) return false; }
                    else if (filter.operator === '=') { if (!(val === v1)) return false; }
                    else if (filter.operator === 'between') { if (!(val >= v1 && val <= v2)) return false; }
                }
                // String checking
                else if (['equals', 'contains', 'starts_with'].includes(filter.operator)) {
                    const val = getStringValue(item, key).toLowerCase();
                    const v1 = filter.value1.toLowerCase();
                    if (filter.operator === 'equals') { if (val !== v1) return false; }
                    else if (filter.operator === 'contains') { if (!val.includes(v1)) return false; }
                    else if (filter.operator === 'starts_with') { if (!val.startsWith(v1)) return false; }
                }
                // Category checking
                else if (filter.operator === 'in') {
                    const val = getCategoryValue(item, key);
                    if (filter.categories.length > 0 && !filter.categories.includes(val)) return false;
                }
            }
            return true;
        });
    }, [data, columnFilters]);

    // 2. Sorting (Global Multi-column)
    const sortedData = useMemo(() => {
        if (sortConfig.length === 0) return filteredData;

        return [...filteredData].sort((a, b) => {
            for (const rule of sortConfig) {
                const { key, direction } = rule;
                const aRaw = (a as any)[key] !== undefined ? (a as any)[key] : (a as any).metrics?.[key];
                const isNumeric = typeof aRaw === 'number' || (typeof aRaw === 'string' && aRaw !== '' && /^[ $0-9,.%次天+-]+$/.test(aRaw));

                let comparison = 0;
                if (isNumeric) {
                    const aVal = getNumericValue(a, key);
                    const bVal = getNumericValue(b, key);
                    comparison = aVal - bVal;
                } else {
                    const aVal = getStringValue(a, key);
                    const bVal = getStringValue(b, key);
                    comparison = aVal.localeCompare(bVal);
                }

                if (comparison !== 0) {
                    return direction === 'asc' ? comparison : -comparison;
                }
            }
            return 0;
        });
    }, [filteredData, sortConfig]);

    // 3. Pagination
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Helpers
    const handleSort = (key: string, direction: 'asc' | 'desc' | null, multi: boolean = false) => {
        setSortConfig(prev => {
            if (!direction) {
                return prev.filter(r => r.key !== key);
            }

            const newRule: SortRule = { key, direction };

            if (multi) {
                // If it exists, remove it first so we can move it to the front
                const otherRules = prev.filter(r => r.key !== key);
                // Prepend to make it primary
                return [newRule, ...otherRules];
            } else {
                return [newRule];
            }
        });
        setCurrentPage(1);
    };

    const handleFilter = (key: string, filter: ColFilter | null) => {
        setColumnFilters(prev => {
            const next = { ...prev };
            if (!filter) delete next[key];
            else next[key] = filter;
            return next;
        });
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setColumnFilters({});
        setCurrentPage(1);
    };

    const removeFilter = (key: string) => {
        handleFilter(key, null);
    };

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    // Convert columnFilters to badges
    const filterBadges = useMemo(() => {
        return Object.entries(columnFilters).map(([key, filter]) => {
            let value = '';
            if (filter.operator === 'between') value = `${filter.value1} - ${filter.value2}`;
            else if (filter.operator === 'in') value = filter.categories.join(', ');
            else value = `${filter.operator} ${filter.value1}`;

            const opLabelMap: Record<string, string> = {
                '>': '>', '<': '<', '=': '=', 'between': '介於',
                'equals': '=', 'contains': '包含', 'starts_with': '開頭',
                'in': '包含'
            };

            const label = labelMap[key] || key;
            const op = opLabelMap[filter.operator] || filter.operator;

            return {
                id: key,
                label: label,
                value: `${op} ${value}`
            };
        });
    }, [columnFilters, labelMap]);

    return {
        paginatedData,
        totalCount: sortedData.length,
        currentPage,
        pageSize,
        sortConfig,
        columnFilters,
        filterBadges,
        handleSort,
        handleFilter,
        handlePageChange,
        handlePageSizeChange,
        clearAllFilters,
        removeFilter,
        setSortConfig,
        setColumnFilters,
        sortedData
    };
}
