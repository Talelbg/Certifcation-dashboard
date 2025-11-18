import { useMemo } from 'react';
import { DeveloperRecord, Community, DateRange, CommunityMetaData, CommunityWithMetadata } from '../types';

/**
 * A custom hook to process raw developer data into aggregated community metrics.
 * It handles filtering by date, grouping by community, and calculating key performance indicators.
 * @param developerData - The raw array of developer records.
 * @param dateRange - The date range for filtering developer records.
 * @param communityMetaData - Additional metadata for communities (e.g., isImportant).
 * @returns An object containing processed community data and overall metrics.
 */
export function useCommunityData(
    developerData: DeveloperRecord[], 
    dateRange: DateRange, 
    communityMetaData: Record<string, CommunityMetaData>
) {
    const processedCommunityData = useMemo((): CommunityWithMetadata[] => {
        const filteredDevelopers = developerData.filter(dev => {
            const devDate = dev.enrollmentDate.getTime();
            const from = dateRange.from?.getTime();
            const to = dateRange.to?.getTime();
            if (from && devDate < from) return false;
            if (to && devDate > to) return false;
            return true;
        });

        const communitiesMap = filteredDevelopers.reduce((acc, dev) => {
            if (!acc[dev.communityCode]) {
                acc[dev.communityCode] = {
                    code: dev.communityCode,
                    developerCount: 0,
                    subscribedCount: 0,
                    certifiedCount: 0,
                    averageProgress: 0,
                    averageCompletionDays: null,
                    developers: [],
                };
            }
            const community = acc[dev.communityCode];
            community.developerCount++;
            if (dev.subscribed) community.subscribedCount++;
            if (dev.certified) community.certifiedCount++;
            community.averageProgress += dev.certificationProgress;
            community.developers.push(dev);
            return acc;
        }, {} as Record<string, Community>);

        return Object.values(communitiesMap).map(community => {
            const averageProgress = community.developerCount > 0 ? community.averageProgress / community.developerCount : 0;
            
            const completedDevs = community.developers.filter(d => d.certified && d.completedAt);
            let averageCompletionDays: number | null = null;
            if (completedDevs.length > 0) {
                const totalDays = completedDevs.reduce((sum, dev) => {
                    if (dev.completedAt) {
                        const diffTime = Math.abs(dev.completedAt.getTime() - dev.enrollmentDate.getTime());
                        return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }
                    return sum;
                }, 0);
                averageCompletionDays = totalDays / completedDevs.length;
            }

            const hasRapidCompletions = community.developers.some(dev => {
                if (!dev.completedAt) return false;
                const diffHours = (dev.completedAt.getTime() - dev.enrollmentDate.getTime()) / (1000 * 60 * 60);
                return diffHours < 5;
            });

            return {
                ...community,
                averageProgress,
                averageCompletionDays,
                meta: communityMetaData[community.code] || { isImportant: false, followUpDate: null },
                hasRapidCompletions,
            };
        }).sort((a,b) => b.developerCount - a.developerCount);
    }, [developerData, dateRange, communityMetaData]);

    const topPerformingCommunities = useMemo(() => {
        if (processedCommunityData.length === 0) return [];

        // Filter for communities that have made some progress or have certified members.
        const eligibleCommunities = processedCommunityData.filter(c => c.averageProgress > 0 || c.certifiedCount > 0);
        if (eligibleCommunities.length === 0) {
            return [];
        }

        // Sort by a score that considers both progress and number of certifications, then take the top 5.
        return [...eligibleCommunities].sort((a,b) => {
            const scoreA = a.averageProgress * (a.certifiedCount + 1); // +1 to give value to progress even with 0 certifications
            const scoreB = b.averageProgress * (b.certifiedCount + 1);
            return scoreB - scoreA;
        }).slice(0, 5);
    }, [processedCommunityData]);
    
    const overallAverageCompletionDays = useMemo(() => {
        const allCompletedDevs = processedCommunityData.flatMap(c => c.developers).filter(d => d.certified && d.completedAt);
        if (allCompletedDevs.length === 0) return null;

        const totalDays = allCompletedDevs.reduce((sum, dev) => {
            if (dev.completedAt) {
                const diffTime = Math.abs(dev.completedAt.getTime() - dev.enrollmentDate.getTime());
                return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            return sum;
        }, 0);

        return totalDays / allCompletedDevs.length;
    }, [processedCommunityData]);

    return {
        processedCommunityData,
        topPerformingCommunities,
        overallAverageCompletionDays
    };
}