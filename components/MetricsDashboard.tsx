import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CommunityWithMetadata, DeveloperRecord } from '../types';
import { ChartBarIcon, UsersIcon, GlobeIcon, TrophyIcon, ShieldExclamationIcon, FlagIcon, AcademicCapIcon, MailIcon } from './icons';

interface MetricsDashboardProps {
  data: CommunityWithMetadata[];
  developerData: DeveloperRecord[];
  topPerformingCommunities: CommunityWithMetadata[];
  overallAverageCompletionDays: number | null;
  potentialFakeAccounts: { count: number, percentage: number };
  rapidCompletionsCount: number;
}

// FIX: Refactored to use a named interface for props to avoid type inference issues.
interface ChartCardProps {
    title: string;
    icon: React.ReactNode;
    // FIX: Made `children` optional to resolve type errors where it was reported as missing.
    children?: React.ReactNode;
    className?: string;
}

const ChartCard = ({ title, icon, children, className }: ChartCardProps) => (
    <div className={`bg-brand-surface p-4 rounded-lg shadow-lg h-full flex flex-col ${className}`}>
        <div className="flex items-center text-brand-text-secondary mb-4">
            {icon}
            <h3 className="font-bold text-lg text-brand-text">{title}</h3>
        </div>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);

const SummaryCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactElement<{ className?: string }> }) => (
    <div className="bg-brand-surface p-6 rounded-lg shadow-lg">
        <div className="flex items-center">
            <div className="p-3 bg-brand-primary/20 rounded-full mr-4 text-brand-primary">
                {React.cloneElement(icon, { className: 'h-6 w-6' })}
            </div>
            <div>
                <p className="text-sm text-brand-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-brand-text">{value}</p>
            </div>
        </div>
    </div>
);

export const MetricsDashboard = ({ data, developerData, topPerformingCommunities, overallAverageCompletionDays, potentialFakeAccounts, rapidCompletionsCount }: MetricsDashboardProps) => {
  const developersByCommunity = data.map(c => ({ name: c.code, developers: c.developerCount }));
  
  const geoDistribution: Record<string, number> = {};
  developerData.forEach((dev) => {
    const country = dev.country || 'Unknown';
    geoDistribution[country] = (geoDistribution[country] || 0) + 1;
  });

  const geoData = Object.entries(geoDistribution).map(([name, developers]) => ({ name, developers })).sort((a, b) => b.developers - a.developers);
  
  const registeredDevelopers = developerData.length;
  const usersStartedCourse = developerData.filter(d => d.certificationProgress > 0).length;
  const activeCommunities = data.filter(c => c.developers.some(d => d.certificationProgress > 0)).length;
  const usersStartedPercentage = registeredDevelopers > 0 ? `(${(usersStartedCourse / registeredDevelopers * 100).toFixed(1)}%)` : '';
  
  const totalCertified = developerData.filter(d => d.certified).length;
  const overallCertificationRate = registeredDevelopers > 0 ? (totalCertified / registeredDevelopers * 100).toFixed(1) : 0;
  
  const totalSubscribed = developerData.filter(d => d.subscribed).length;
  const overallSubscriberRate = registeredDevelopers > 0 ? (totalSubscribed / registeredDevelopers * 100).toFixed(1) : 0;


  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard title="Registered Developers" value={registeredDevelopers} icon={<UsersIcon />} />
            <SummaryCard title="Total Certified" value={totalCertified} icon={<AcademicCapIcon />} />
            <SummaryCard title="Users Started Course" value={`${usersStartedCourse} ${usersStartedPercentage}`} icon={<ChartBarIcon />} />
            <SummaryCard title="Active Communities" value={activeCommunities} icon={<UsersIcon />} />
            <SummaryCard title="Avg. Completion Time" value={overallAverageCompletionDays ? `${overallAverageCompletionDays.toFixed(1)} days` : 'N/A'} icon={<GlobeIcon />} />
            <SummaryCard title="Overall Certification Rate" value={`${overallCertificationRate}%`} icon={<AcademicCapIcon />} />
            <SummaryCard title="Overall Subscriber Rate" value={`${overallSubscriberRate}%`} icon={<MailIcon />} />
            <SummaryCard title="Potential Fake Accounts" value={`${potentialFakeAccounts.count} (${potentialFakeAccounts.percentage.toFixed(1)}%)`} icon={<ShieldExclamationIcon />} />
            <SummaryCard title="Rapid Completions (&lt;5h)" value={rapidCompletionsCount} icon={<FlagIcon />} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Developers by Community" icon={<ChartBarIcon />} className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={developersByCommunity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                        <Legend />
                        <Bar dataKey="developers" fill="#6366F1" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
            
            {topPerformingCommunities.length > 0 ? (
                 <ChartCard title="Top 5 Performing Communities" icon={<TrophyIcon className="h-5 w-5 mr-2" />}>
                    <div className="space-y-3">
                        {topPerformingCommunities.map((community, index) => (
                            <div key={community.code} className="flex items-center space-x-3 text-sm p-2 rounded-md bg-brand-bg">
                                <span className="font-bold text-lg text-yellow-400 w-5">{index + 1}</span>
                                <div className="flex-grow">
                                    <p className="font-bold text-brand-text">{community.code}</p>
                                    <p className="text-xs text-brand-text-secondary">{community.developerCount} Developers</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-brand-text">{community.averageProgress.toFixed(1)}%</p>
                                    <p className="text-xs text-brand-text-secondary">{community.certifiedCount} Certified</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            ) : (
                <ChartCard title="Top Performing Communities" icon={<TrophyIcon className="h-5 w-5 mr-2" />}>
                    <div className="flex flex-col justify-center h-full items-center text-center text-brand-text-secondary">
                        <div className="p-4 bg-brand-border rounded-full mb-4">
                            <TrophyIcon className="h-10 w-10 text-brand-text-secondary" />
                        </div>
                        <h4 className="font-semibold text-brand-text">No Top Performers</h4>
                        <p className="text-xs mt-2">Adjust date filters or check if communities have made progress.</p>
                    </div>
                </ChartCard>
            )}
        </div>

        <ChartCard title="Developer Distribution by Country (Top 15)" icon={<GlobeIcon />}>
             <ResponsiveContainer width="100%" height={400}>
                <BarChart data={geoData.slice(0, 15).reverse()} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9CA3AF" />
                    <YAxis type="category" dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Bar dataKey="developers" fill="#818CF8" name="Developers" />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    </div>
  );
};