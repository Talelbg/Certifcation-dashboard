import { useState, useCallback } from 'react';
import { DateRange, DeveloperRecord } from '../types';

/**
 * A custom hook to manage filtering controls, such as the date range.
 * @returns An object containing the filter state and handlers to update it.
 */
export function useFilters() {
    const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

    const setInitialDateRange = useCallback((data: DeveloperRecord[]) => {
        if (data.length === 0) {
            setDateRange({ from: null, to: null });
            return;
        }

        const { min, max } = data.reduce((acc, record) => {
            const time = record.enrollmentDate.getTime();
            return {
                min: Math.min(acc.min, time),
                max: Math.max(acc.max, time),
            };
        }, { min: Infinity, max: -Infinity });
        
        const minDate = new Date(min);
        const maxDate = new Date(max);

        minDate.setHours(0, 0, 0, 0);
        maxDate.setHours(23, 59, 59, 999);
        
        setDateRange({ from: minDate, to: maxDate });
    }, []);

    const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: 'from' | 'to') => {
        const value = e.target.value;
        setDateRange(prev => {
            const newRange = { ...prev };
            if (!value) {
                newRange[field] = null;
            } else {
                // The value from a date input is in 'YYYY-MM-DD' format, which is parsed by the Date constructor in UTC.
                // To avoid timezone issues, we can manually parse and construct the date in local time.
                const parts = value.split('-').map(part => parseInt(part, 10));
                const date = new Date(parts[0], parts[1] - 1, parts[2]);

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