import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DeveloperRecord } from '../types';
import { UsersIcon, ChartBarIcon } from './icons';

interface MembershipDashboardProps {
  developerData: DeveloperRecord[];
}

const SummaryCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactElement<{ className?: string }> }) => (
    <div className="bg-brand-bg p-6 rounded-lg shadow-inner">
        <div className="flex items-center">
            <div className="p-3 bg-brand-secondary/20 rounded-full mr-4 text-brand-secondary">
                {React.cloneElement(icon, { className: 'h-6 w-6' })}
            </div>
            <div>
                <p className="text-sm text-brand-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-brand-text">{value}</p>
            </div>
        </div>
    </div>
);


export const MembershipDashboard = ({ developerData }: MembershipDashboardProps) => {
    
    const totalDevelopers = developerData.length;
    const members = developerData.filter(d => d.acceptedMembership);
    const totalMembers = members.length;
    const membershipRate = totalDevelopers > 0 ? ((totalMembers / totalDevelopers) * 100).toFixed(1) : 0;

    const memberGrowthData = members
        .sort((a, b) => a.enrollmentDate.getTime() - b.enrollmentDate.getTime())
        .reduce((acc, member) => {
            const date = member.enrollmentDate.toISOString().split('T')[0];
            const lastEntry = acc[acc.length - 1];
            if (acc.length > 0 && lastEntry.date === date) {
                lastEntry.members += 1;
            } else {
                acc.push({ date, members: (lastEntry?.members || 0) + 1 });
            }
            return acc;
        }, [] as { date: string, members: number }[]);
        

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <SummaryCard title="Total Members" value={totalMembers} icon={<UsersIcon />} />
                 <SummaryCard title="Membership Rate" value={`${membershipRate}%`} icon={<ChartBarIcon />} />
                 <SummaryCard title="Total Developers" value={totalDevelopers} icon={<UsersIcon />} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1 bg-brand-surface p-4 rounded-lg shadow-lg">
                    <h3 className="font-bold text-lg mb-4 text-brand-text">Membership Growth Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={memberGrowthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                            <Legend />
                            <Line type="monotone" dataKey="members" stroke="#EC4899" name="Cumulative Members" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-1 bg-brand-surface p-6 rounded-lg shadow-lg">
                    <h3 className="font-bold text-lg mb-4 text-brand-text">Program Structure & Benefits</h3>
                    <div className="text-brand-text-secondary space-y-4 text-sm">
                        <p>Our membership program is designed to foster a vibrant and engaged developer community. It provides exclusive access to resources, networking opportunities, and recognition for contributions.</p>
                        <div>
                            <h4 className="font-semibold text-brand-text mb-2">Key Benefits:</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Early access to new tools and platform updates.</li>
                                <li>Invitations to exclusive webinars and Q&A sessions with the core team.</li>
                                <li>A direct channel for feedback and feature requests.</li>
                                <li>Member-only forums and discussion groups.</li>
                                <li>Featured member spotlights on our blog and social media.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};