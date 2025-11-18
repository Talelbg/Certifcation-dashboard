import { useMemo } from 'react';
import { DeveloperRecord } from '../types';

const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 
    'sharklasers.com', 'getnada.com', 'throwawaymail.com', 'tempmailo.com', 'incognitomail.org',
    'tempr.email', 'moakt.com', 'maildrop.cc'
]);

/**
 * A custom hook to calculate developer-specific metrics from the raw data.
 * @param developerData - The raw array of developer records.
 * @returns An object containing metrics like potential fake accounts and rapid completion counts.
 */
export function useDeveloperMetrics(developerData: DeveloperRecord[]) {
    const potentialFakeAccounts = useMemo(() => {
        const fakes = developerData.filter(dev => {
            try {
                const [username, domain] = dev.developerId.split('@');
                if (!domain) return false;
                
                // Criterion 1: Disposable domain
                if (DISPOSABLE_EMAIL_DOMAINS.has(domain.toLowerCase())) {
                    return true;
                }
                // Criterion 2: Email contains '+' alias
                if (dev.developerId.includes('+')) {
                    return true;
                }
                // Criterion 3: Username is purely numeric
                if (/^\d+$/.test(username)) {
                    return true;
                }
                return false;
            } catch {
                return false;
            }
        });
        const count = fakes.length;
        const percentage = developerData.length > 0 ? (count / developerData.length) * 100 : 0;
        return { count, percentage };
    }, [developerData]);

    const rapidCompletions = useMemo(() => {
        const developers = developerData.filter(dev => {
            if (!dev.completedAt) return false;
            // Completion within 5 hours of enrollment is considered rapid.
            const diffHours = (dev.completedAt.getTime() - dev.enrollmentDate.getTime()) / (1000 * 60 * 60);
            return diffHours < 5;
        });
        return {
            count: developers.length,
            developers: developers
        };
    }, [developerData]);

    return { potentialFakeAccounts, rapidCompletions };
}