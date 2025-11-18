import React, { useState } from 'react';
import { CommunityWithMetadata } from '../types';
import { StarIcon, CalendarIcon, FlagIcon } from './icons';

interface ProgressByCommunityTableProps {
    data: CommunityWithMetadata[];
    onToggleImportant: (communityCode: string) => void;
    onSetFollowUp: (communityCode: string, date: string) => void;
}

const ProgressBar = ({ progress }: { progress: number }) => {
    const bgColor = progress > 80 ? 'bg-green-500' : progress > 50 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="w-full bg-brand-border rounded-full h-2.5">
            <div className={`${bgColor} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
        </div>
    );
};

export const ProgressByCommunityTable = ({ data, onToggleImportant, onSetFollowUp }: ProgressByCommunityTableProps) => {
    const [editingFollowUp, setEditingFollowUp] = useState<string | null>(null);
    const [followUpDate, setFollowUpDate] = useState('');

    const handleSetFollowUpClick = (community: CommunityWithMetadata) => {
        setEditingFollowUp(community.code);
        setFollowUpDate(community.meta.followUpDate || '');
    };

    const handleSaveFollowUp = (communityCode: string) => {
        onSetFollowUp(communityCode, followUpDate);
        setEditingFollowUp(null);
    };

    return (
        <div className="bg-brand-surface p-4 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg mb-4">Community Details</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-brand-text-secondary">
                    <thead className="text-xs text-brand-text uppercase bg-brand-bg">
                        <tr>
                            <th scope="col" className="px-6 py-3">Important</th>
                            <th scope="col" className="px-6 py-3">Community Code</th>
                            <th scope="col" className="px-6 py-3">Developers</th>
                            <th scope="col" className="px-6 py-3">Subscribed</th>
                            <th scope="col" className="px-6 py-3">Certified</th>
                            <th scope="col" className="px-6 py-3">Avg. Progress</th>
                            <th scope="col" className="px-6 py-3">Avg. Completion (Days)</th>
                            <th scope="col" className="px-6 py-3">Follow-up Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((community) => (
                            <tr key={community.code} className="border-b border-brand-border hover:bg-brand-border/50">
                                <td className="px-6 py-4">
                                    <button onClick={() => onToggleImportant(community.code)}>
                                        <StarIcon filled={community.meta.isImportant} />
                                    </button>
                                </td>
                                <th scope="row" className="px-6 py-4 font-medium text-brand-text whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        <span>{community.code}</span>
                                        {community.hasRapidCompletions && (
                                            <span title="Contains developers with rapid certification completion (<5 hours)">
                                                <FlagIcon className="h-5 w-5 text-red-500" />
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <td className="px-6 py-4">{community.developerCount}</td>
                                <td className="px-6 py-4">{community.subscribedCount}</td>
                                <td className="px-6 py-4">{community.certifiedCount}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <span className="w-12 mr-2 text-right">{community.averageProgress.toFixed(1)}%</span>
                                        <ProgressBar progress={community.averageProgress} />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {community.averageCompletionDays ? community.averageCompletionDays.toFixed(1) : 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    {editingFollowUp === community.code ? (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="date"
                                                value={followUpDate}
                                                onChange={(e) => setFollowUpDate(e.target.value)}
                                                className="bg-brand-border text-brand-text rounded px-2 py-1 text-sm"
                                            />
                                            <button onClick={() => handleSaveFollowUp(community.code)} className="text-green-400">Save</button>
                                            <button onClick={() => setEditingFollowUp(null)} className="text-red-400">Cancel</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <span>{community.meta.followUpDate || 'Not set'}</span>
                                            <button onClick={() => handleSetFollowUpClick(community)} className="text-brand-text-secondary hover:text-brand-primary">
                                                <CalendarIcon />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {data.length === 0 && <p className="text-center py-8">No community data to display. Please upload a CSV file.</p>}
            </div>
        </div>
    );
};