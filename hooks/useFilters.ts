import React, { useState, useCallback } from 'react';
import { DateRange, DeveloperRecord } from '../types';

/**
 * A custom hook to manage filtering controls, such as the date range.
 * @returns An object containing the filter state and handlers to update it.
 */
export function useFilters() {
    const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

    const setInitialDateRange = useCallback((data: DeveloperRecord[]) => {
        if (data.length > 0) {
            const dates = data.map(d => d.enrollmentDate.getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));

            minDate.setHours(0, 0, 0, 0);
            maxDate.setHours(23, 59, 59, 999);
            
            setDateRange({ from: minDate, to: maxDate });
        } else {
            setDateRange({ from: null, to: null });
        }
    }, []);

    const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: 'from' | 'to') => {
        const value = e.target.value;
        setDateRange(prev => {
            const newRange = { ...prev };
            if (!value) {
                newRange[field] = null;
            } else {
                const date = new Date(value); 
                if (field === 'from') {
                    date.setHours(0, 0, 0, 0);
                    newRange.from = date;
                } else { 
                    date.setHours(23, 59, 59, 999);
                    newRange.to = date;
                }
            }
            return newRange;
        });
    }, []);

    return {
        dateRange,
        handleDateChange,
        setInitialDateRange
    };
}