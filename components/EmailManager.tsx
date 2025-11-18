import React, { useState, useMemo } from 'react';
import { EmailTemplate, CommunityWithMetadata, DeveloperRecord } from '../types';
import { MailIcon } from './icons';

const initialTemplates: EmailTemplate[] = [
    { 
        id: '1', 
        name: 'Progress Nudge (50% mark)', 
        subject: 'Great Progress, {{first_name}}!', 
        body: 'Hi {{first_name}} {{last_name}},\n\nJust a quick note to say great work on reaching {{completion_percentage}}% in the certification program. Keep up the momentum!\n\nBest,\nCommunity Manager' 
    },
    { 
        id: '2', 
        name: 'Almost There! (80% mark)', 
        subject: 'You\'re so close, {{first_name}}!', 
        body: 'Hi {{first_name}},\n\nWow, you are at {{completion_percentage}}% completion. You are so close to the finish line! Let us know if you need any help with the final modules.\n\nBest,\nCommunity Manager' 
    },
    { 
        id: '3', 
        name: 'Congratulations on Certification!', 
        subject: 'Congratulations on your new certification, {{first_name}}!', 
        body: 'Hi {{first_name}} {{last_name}},\n\nAmazing work! You have successfully completed the certification program. Congratulations on this fantastic achievement!\n\nWe are proud to have you in the {{community_code}} community.\n\nBest,\nCommunity Manager' 
    },
];

const replaceTags = (text: string, developer: DeveloperRecord): string => {
    if (!text) return '';
    return text
        .replace(/{{first_name}}/g, developer.firstName || '')
        .replace(/{{last_name}}/g, developer.lastName || '')
        .replace(/{{email}}/g, developer.developerId)
        .replace(/{{completion_percentage}}/g, String(developer.certificationProgress))
        .replace(/{{community_code}}/g, developer.communityCode);
};

interface EmailManagerProps {
  communities: CommunityWithMetadata[];
  developerData: DeveloperRecord[];
}

export const EmailManager = ({ communities, developerData }: EmailManagerProps) => {
    const [apiKey, setApiKey] = useState('');
    const [groupId, setGroupId] = useState('');
    
    const [templates] = useState<EmailTemplate[]>(initialTemplates);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0].id);

    const [filterCommunity, setFilterCommunity] = useState('all');
    const [filterMinProgress, setFilterMinProgress] = useState(0);
    const [filterMaxProgress, setFilterMaxProgress] = useState(100);

    const [isSending, setIsSending] = useState(false);

    const selectedTemplate = useMemo(() => {
        return templates.find(t => t.id === selectedTemplateId)!;
    }, [selectedTemplateId, templates]);

    const filteredDevelopers = useMemo(() => {
        return developerData.filter(dev => {
            if (!dev.subscribed) return false; // Only email subscribed users
            const inCommunity = filterCommunity === 'all' || dev.communityCode === filterCommunity;
            const inProgressRange = dev.certificationProgress >= filterMinProgress && dev.certificationProgress <= filterMaxProgress;
            return inCommunity && inProgressRange;
        });
    }, [developerData, filterCommunity, filterMinProgress, filterMaxProgress]);

    const handleSendEmails = () => {
        if (!apiKey || !groupId) {
            alert('Please provide your MailerLite API Key and Group ID to send emails.');
            return;
        }
        if (filteredDevelopers.length === 0) {
            alert('No subscribed developers match the current filters.');
            return;
        }

        setIsSending(true);

        console.log("--- SIMULATING MAILERLITE API DISPATCH ---");
        console.log(`Using API Key: ${apiKey.substring(0, 4)}...`);
        console.log(`Targeting Group ID: ${groupId}`);
        
        const subscribers = filteredDevelopers.map(dev => ({
            email: dev.developerId,
            fields: {
                name: dev.firstName,
                last_name: dev.lastName,
                completion_percentage: dev.certificationProgress,
                community_code: dev.communityCode,
            },
        }));

        console.log(`Preparing to send campaign to ${subscribers.length} subscribers.`);
        console.log('Sample subscribers payload:', subscribers.slice(0, 2));

        const subject = selectedTemplate.subject;
        const body = selectedTemplate.body;
        console.log(`\n--- CAMPAIGN CONTENT ---`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:\n${body}`);
        console.log('--------------------------\n');


        setTimeout(() => {
            setIsSending(false);
            alert(`Simulated adding ${filteredDevelopers.length} subscribers to MailerLite and sending a campaign. Check the console for details.`);
        }, 2000);
    };

    const previewDeveloper = filteredDevelopers[0];
    
    return (
      <div className="space-y-6">
        <div className="bg-brand-surface p-4 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg mb-3 text-brand-text">MailerLite Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="mailerlite-api-key" className="block text-sm font-medium text-brand-text-secondary mb-1">API Key</label>
                    <input type="password" id="mailerlite-api-key" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your MailerLite API Key" className="w-full bg-brand-border text-brand-text rounded-md px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="mailerlite-group-id" className="block text-sm font-medium text-brand-text-secondary mb-1">Group ID</label>
                    <input type="text" id="mailerlite-group-id" value={groupId} onChange={e => setGroupId(e.target.value)} placeholder="Enter the destination Group ID" className="w-full bg-brand-border text-brand-text rounded-md px-3 py-2" />
                </div>
            </div>
        </div>

        <div className="bg-brand-surface p-4 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg mb-3 text-brand-text">Campaign Builder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="template-select" className="block text-sm font-medium text-brand-text-secondary mb-1">Email Template</label>
                        <select id="template-select" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full bg-brand-border text-brand-text rounded-md px-3 py-2">
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="community-filter" className="block text-sm font-medium text-brand-text-secondary mb-1">Target Community</label>
                        <select id="community-filter" value={filterCommunity} onChange={e => setFilterCommunity(e.target.value)} className="w-full bg-brand-border text-brand-text rounded-md px-3 py-2">
                            <option value="all">All Communities</option>
                            {communities.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-brand-text-secondary mb-1">Target Progress ({filterMinProgress}% - {filterMaxProgress}%)</label>
                         <div className="flex items-center space-x-2">
                            <input type="range" min="0" max="100" value={filterMinProgress} onChange={e => setFilterMinProgress(Math.min(parseInt(e.target.value, 10), filterMaxProgress))} className="w-full" />
                            <input type="range" min="0" max="100" value={filterMaxProgress} onChange={e => setFilterMaxProgress(Math.max(parseInt(e.target.value, 10), filterMinProgress))} className="w-full" />
                         </div>
                    </div>
                </div>

                <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
                     <h4 className="font-bold text-md mb-2 text-brand-text">Live Preview</h4>
                     {previewDeveloper ? (
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-medium text-brand-text-secondary">Subject</label>
                                <p className="mt-1 p-2 bg-brand-border rounded-md text-brand-text">{replaceTags(selectedTemplate?.subject, previewDeveloper)}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-text-secondary">Body</label>
                                <pre className="mt-1 p-2 bg-brand-border rounded-md text-brand-text whitespace-pre-wrap font-sans">{replaceTags(selectedTemplate?.body, previewDeveloper)}</pre>
                            </div>
                            <p className="text-xs text-brand-text-secondary italic">Preview based on developer: {previewDeveloper.developerId}</p>
                        </div>
                     ) : (
                        <div className="flex items-center justify-center h-full text-brand-text-secondary text-center">
                            <p>No subscribed developers match the current filters.</p>
                        </div>
                     )}
                </div>
            </div>

             <div className="mt-6 border-t border-brand-border pt-4 flex items-center justify-between">
                <p className="text-brand-text font-semibold">
                    {filteredDevelopers.length} subscribed developers targeted.
                </p>
                <button 
                    onClick={handleSendEmails}
                    disabled={isSending || filteredDevelopers.length === 0 || !apiKey || !groupId}
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    <MailIcon className="h-5 w-5 mr-2" />
                    {isSending ? 'Sending...' : 'Send Campaign via MailerLite'}
                </button>
            </div>
             <div className="text-xs text-brand-text-secondary mt-2">
                Available tags: <code>{'{{first_name}}'}</code>, <code>{'{{last_name}}'}</code>, <code>{'{{email}}'}</code>, <code>{'{{completion_percentage}}'}</code>, <code>{'{{community_code}}'}</code>.
            </div>
        </div>
      </div>
    );
};