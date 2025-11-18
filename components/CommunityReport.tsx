import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { GoogleGenAI } from '@google/genai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CommunityWithMetadata, DateRange, DeveloperRecord } from '../types';
import { UsersIcon, DownloadIcon, SparklesIcon, ChartBarIcon, CopyIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface CommunityReportProps {
    communities: CommunityWithMetadata[];
    dateRange: DateRange;
}

const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const ReportCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactElement<{ className?: string }> }) => (
    <div className="bg-brand-bg p-4 rounded-lg shadow-inner flex items-center">
        <div className="p-3 bg-brand-primary/20 rounded-full mr-4 text-brand-primary">
            {React.cloneElement(icon, { className: 'h-6 w-6' })}
        </div>
        <div>
            <p className="text-sm text-brand-text-secondary">{title}</p>
            <p className="text-xl font-bold text-brand-text">{value}</p>
        </div>
    </div>
);

const downloadListAsCsv = (data: DeveloperRecord[], filename: string) => {
    if (data.length === 0) {
        alert(`No data available to download.`);
        return;
    }
    const dataForCsv = data.map(dev => ({
        'Email': dev.developerId,
        'Code': dev.communityCode,
        'Country': dev.country,
        'Percentage Completed': dev.certificationProgress,
        'Created At': dev.enrollmentDate.toISOString(),
        'Accepted Marketing': dev.subscribed,
        'Accepted Membership': dev.acceptedMembership,
        'Completed At': dev.completedAt ? dev.completedAt.toISOString() : ''
    }));
    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-s-8,' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const downloadListAsPdf = async (data: DeveloperRecord[], filename: string, title: string) => {
    if (data.length === 0) {
        alert(`No data available to download.`);
        return;
    }
    
    const doc = new jsPDF();
    doc.text(title, 14, 16);
    
    const tableColumn = ["Email", "Community", "Country", "Progress", "Enrolled On"];
    const tableRows: (string|number)[][] = [];

    data.forEach(dev => {
        const devData = [
            dev.developerId,
            dev.communityCode,
            dev.country,
            `${dev.certificationProgress}%`,
            dev.enrollmentDate.toLocaleDateString(),
        ];
        tableRows.push(devData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: 'grid',
        styles: {
            fontSize: 8
        },
        headStyles: {
            fillColor: [79, 70, 229]
        }
    });
    
    doc.save(filename);
};


export const CommunityReport = ({ communities, dateRange }: CommunityReportProps) => {
    const [selectedCommunityCode, setSelectedCommunityCode] = useState<string | null>(null);
    const [pricePerCertified, setPricePerCertified] = useState<number>(0);
    const [invoiceDetails, setInvoiceDetails] = useState('');
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [copyButtonText, setCopyButtonText] = useState('Copy HTML');

    const reportContentRef = useRef<HTMLDivElement>(null);

    const selectedCommunity = useMemo(() => {
        if (!selectedCommunityCode) return null;
        return communities.find(c => c.code === selectedCommunityCode) || null;
    }, [selectedCommunityCode, communities]);
    
    const newCertifiedCount = useMemo(() => {
        if (!selectedCommunity) return 0;
        return selectedCommunity.developers.filter(d => d.certified && d.completedAt).length;
    }, [selectedCommunity]);

    const totalReward = useMemo(() => newCertifiedCount * pricePerCertified, [newCertifiedCount, pricePerCertified]);

    const membershipEvolutionData = useMemo(() => {
        if (!selectedCommunity) return [];
        const sortedDevs = selectedCommunity.developers.sort((a,b) => a.enrollmentDate.getTime() - b.enrollmentDate.getTime());
        const data: { date: string, developers: number, startedCourse: number }[] = [];
        let cumulativeDevelopers = 0;
        let cumulativeStarted = 0;

        sortedDevs.forEach(dev => {
            cumulativeDevelopers++;
            if (dev.certificationProgress > 0) {
                cumulativeStarted++;
            }
            const dateStr = dev.enrollmentDate.toISOString().split('T')[0];
            const existingEntry = data.find(d => d.date === dateStr);
            if (existingEntry) {
                existingEntry.developers = cumulativeDevelopers;
                existingEntry.startedCourse = cumulativeStarted;
            } else {
                data.push({ date: dateStr, developers: cumulativeDevelopers, startedCourse: cumulativeStarted });
            }
        });
        return data;
    }, [selectedCommunity]);
    
    const handleGenerateAnalysis = async () => {
        if (!selectedCommunity) return;
        setIsGeneratingAnalysis(true);
        setAnalysisError(null);
        setAnalysis(null);

        try {
            const overallAverageProgress = communities.reduce((sum, c) => sum + c.averageProgress, 0) / (communities.length || 1);
            const communitiesWithCompletion = communities.filter(c => c.averageCompletionDays != null);
            const overallAverageCompletionDays = communitiesWithCompletion.reduce((sum, c) => sum + c.averageCompletionDays!, 0) / (communitiesWithCompletion.length || 1);

            const prompt = `
                Generate a concise, analytical report in a well-formatted HTML email format for the community manager about the "${selectedCommunity.code}" community.

                **Instructions for the HTML format:**
                - The output MUST be a complete, self-contained HTML document. Include \`<html>\`, \`<head>\` with a \`<style>\` tag, and \`<body>\`.
                - CSS should be included in the \`<style>\` tag in the head. Do NOT use inline styles on every element unless absolutely necessary for email client compatibility (like for background colors).
                - The design should be clean, professional, and responsive. It must be readable on both dark and light email backgrounds.
                - Use a main container with a dark background color (#1E293B), padding (20px), and a max-width of 600px. Center it.
                - Use a standard, email-safe font stack like 'Arial, Helvetica, sans-serif'.
                - Use semantic HTML: \`<h2>\`, \`<h3>\`, \`p\`, \`ul\`, \`li\`.
                - Text color should be light (e.g., #F1F5F9) for readability against the dark background. Links should be a contrasting color (e.g., #818CF8).

                **Analysis Period:** ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}.

                **Data for Community "${selectedCommunity.code}":**
                - Total Developers: ${selectedCommunity.developerCount}
                - Certified Members: ${selectedCommunity.certifiedCount} (${((selectedCommunity.certifiedCount / (selectedCommunity.developerCount || 1)) * 100).toFixed(1)}%)
                - Average Course Progress: ${selectedCommunity.averageProgress.toFixed(1)}%
                - Average Completion Time: ${selectedCommunity.averageCompletionDays ? selectedCommunity.averageCompletionDays.toFixed(1) + ' days' : 'N/A'}

                **Benchmark Data (Average across all communities):**
                - Average Course Progress: ${overallAverageProgress.toFixed(1)}%
                - Average Completion Time: ${isNaN(overallAverageCompletionDays) ? 'N/A' : overallAverageCompletionDays.toFixed(1) + ' days'}

                **Content to include in the HTML report body:**

                1.  A main heading: \`Community Performance Review: ${selectedCommunity.code}\`
                2.  A sub-heading for the analysis period.
                3.  A section: \`<h3>Key Metrics</h3>\` with a simple table or styled list showing the community's data.
                4.  A section: \`<h3>Historical Performance</h3>\`
                    - Analyze the community's performance and trends within the specified period. Mention growth and engagement.
                5.  A section: \`<h3>Comparative Benchmarking</h3>\`
                    - Compare "${selectedCommunity.code}" against the average of other communities. Is it performing better or worse? Highlight key differences.
                6.  A section: \`<h3>Key Takeaways & Recommendations</h3>\`
                    - Provide 2-3 actionable bullet points based on the analysis.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setAnalysis(response.text);

        } catch (err: any) {
            console.error("Error generating analysis:", err);
            setAnalysisError(`Failed to generate analysis. ${err.message || 'Please try again.'}`);
        } finally {
            setIsGeneratingAnalysis(false);
        }
    };

    const handleCopyHtml = () => {
        if (!analysis) return;
        try {
            // The Clipboard API's `write` method with a 'text/html' blob allows us to
            // copy the content as rich text. When pasted into an email client,
            // the HTML will be rendered with its formatting intact.
            const blob = new Blob([analysis], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });
            navigator.clipboard.write([clipboardItem]).then(() => {
                setCopyButtonText('Copied!');
                setTimeout(() => setCopyButtonText('Copy HTML'), 2000);
            }).catch(err => {
                console.error('Failed to copy rendered HTML: ', err);
                alert('Could not copy HTML to clipboard. Your browser might not support this feature.');
            });
        } catch (error) {
            console.error('Error creating ClipboardItem: ', error);
            alert('An error occurred while preparing to copy.');
        }
    };
    
    const handleDownloadPdf = async () => {
        const reportElement = reportContentRef.current;
        if (!reportElement) return;

        const canvas = await html2canvas(reportElement, {
            backgroundColor: '#1E293B',
            scale: 2,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`community_report_${selectedCommunityCode}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleDownloadList = (type: 'certified' | 'subscribers', format: 'csv' | 'pdf') => {
        if (!selectedCommunity) return;

        const list = type === 'certified' 
            ? selectedCommunity.developers.filter(dev => dev.certified)
            : selectedCommunity.developers.filter(dev => dev.subscribed);
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${type}_${selectedCommunity.code}_${timestamp}`;
        const title = `${type.charAt(0).toUpperCase() + type.slice(1)} for ${selectedCommunity.code}`;

        if (format === 'csv') {
            downloadListAsCsv(list, `${filename}.csv`);
        } else if (format === 'pdf') {
            // Note: jspdf-autotable is not in dependencies, so we create a basic text PDF or use html2canvas for a visual one.
            // For a better data export, CSV is recommended. This is a simplified placeholder.
            const dataForPdf = list.map(dev => `${dev.developerId}, ${dev.country}, Progress: ${dev.certificationProgress}%`).join('\n');
            const pdf = new jsPDF();
            pdf.text(title, 10, 10);
            pdf.text(dataForPdf, 10, 20);
            pdf.save(`${filename}.pdf`);
        }
    };

    return (
        <div className="bg-brand-surface p-4 rounded-lg shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                <div className="w-full md:w-auto mb-2 md:mb-0 md:flex-grow md:mr-4">
                    <select
                        value={selectedCommunityCode || ''}
                        onChange={(e) => {
                            setSelectedCommunityCode(e.target.value);
                            setAnalysis(null);
                        }}
                        className="w-full bg-brand-border text-brand-text rounded-md px-3 py-2"
                    >
                        <option value="">-- Select a Community --</option>
                        {communities.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                </div>
                {selectedCommunity && (
                    <div className="flex items-center flex-wrap gap-2">
                         <button
                            onClick={handleDownloadPdf}
                            className="bg-brand-secondary hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
                        >
                            <DownloadIcon />
                            Download Full Report (PDF)
                        </button>
                    </div>
                )}
            </div>

            {selectedCommunity ? (
                <div>
                    <div ref={reportContentRef} className="p-6 bg-brand-surface rounded-lg">
                        <h2 className="text-2xl font-bold text-brand-text mb-2">Community Report: {selectedCommunity.code}</h2>
                        <p className="text-sm text-brand-text-secondary mb-6">
                            Analysis Period: {formatDate(dateRange.from)} to {formatDate(dateRange.to)}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <ReportCard title="Total Developers" value={selectedCommunity.developerCount} icon={<UsersIcon />} />
                            <ReportCard title="Certified Members" value={`${selectedCommunity.certifiedCount} (${((selectedCommunity.certifiedCount / (selectedCommunity.developerCount || 1)) * 100).toFixed(1)}%)`} icon={<UsersIcon />} />
                            <ReportCard title="Avg. Completion Time" value={selectedCommunity.averageCompletionDays ? `${selectedCommunity.averageCompletionDays.toFixed(1)} days` : 'N/A'} icon={<ChartBarIcon />} />
                        </div>

                        <div className="bg-brand-bg p-4 rounded-lg border border-brand-border mb-6">
                            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                                <h3 className="text-lg font-bold text-brand-text">Analysis and Contextual Remarks</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleGenerateAnalysis}
                                        disabled={isGeneratingAnalysis}
                                        className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-1 px-3 rounded-lg flex items-center text-sm disabled:bg-gray-500"
                                    >
                                        <SparklesIcon />
                                        {isGeneratingAnalysis ? 'Generating...' : 'Generate Analysis'}
                                    </button>
                                    {analysis && (
                                        <button
                                            onClick={handleCopyHtml}
                                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded-lg flex items-center text-sm"
                                        >
                                            <CopyIcon className="h-4 w-4 mr-2" />
                                            {copyButtonText}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {analysisError && <p className="text-red-400 text-xs">{analysisError}</p>}
                            {isGeneratingAnalysis && (
                                <div className="text-center py-4">
                                    <p className="text-brand-text-secondary text-sm animate-pulse">AI is analyzing the data, please wait...</p>
                                </div>
                            )}
                            {analysis && (
                                <div className="mt-4 p-4 bg-black/20 rounded-lg">
                                    <iframe
                                        srcDoc={analysis}
                                        className="w-full h-96 border-0 rounded-md"
                                        title="Email Preview"
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-brand-bg p-4 rounded-lg border border-brand-border mb-6">
                            <h3 className="text-lg font-bold text-brand-text mb-4">Financials & Rewarding</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div>
                                    <label className="text-sm text-brand-text-secondary block">Price per Certified Member</label>
                                    <input type="number" value={pricePerCertified} onChange={e => setPricePerCertified(parseFloat(e.target.value) || 0)} className="w-full bg-brand-border text-brand-text rounded px-2 py-1.5 mt-1" />
                                </div>
                                <div>
                                    <label className="text-sm text-brand-text-secondary block">Total Certified (in period)</label>
                                    <p className="text-xl font-semibold text-brand-text mt-1">{newCertifiedCount}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-brand-text-secondary block">Total Reward Amount</label>
                                    <p className="text-xl font-semibold text-green-400 mt-1">${totalReward.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="text-sm text-brand-text-secondary block">Invoice Details / Notes</label>
                                <input type="text" value={invoiceDetails} onChange={e => setInvoiceDetails(e.target.value)} placeholder="e.g., Invoice #12345, Sent on 2024-08-01" className="w-full bg-brand-border text-brand-text rounded px-2 py-1.5 mt-1" />
                            </div>
                        </div>
                        
                        <div className="bg-brand-bg p-4 rounded-lg border border-brand-border mb-6">
                             <h3 className="text-lg font-bold text-brand-text mb-4">Membership Evolution & Enrollment Funnel</h3>
                             <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={membershipEvolutionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="developers" name="Total Developers" stroke="#818CF8" />
                                    <Line type="monotone" dataKey="startedCourse" name="Started Course" stroke="#F472B6" />
                                </LineChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                    
                    {/* Data Export Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
                            <h3 className="text-lg font-bold text-brand-text mb-2">Certified Members List</h3>
                            <p className="text-sm text-brand-text-secondary mb-4">Export the list of all 100% certified developers in this community.</p>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleDownloadList('certified', 'csv')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> CSV</button>
                                <button onClick={() => handleDownloadList('certified', 'csv')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> Excel</button>
                                <button onClick={() => handleDownloadList('certified', 'pdf')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> PDF</button>
                            </div>
                        </div>
                         <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
                            <h3 className="text-lg font-bold text-brand-text mb-2">Subscribers List</h3>
                            <p className="text-sm text-brand-text-secondary mb-4">Export the list of all developers who opted-in for marketing.</p>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleDownloadList('subscribers', 'csv')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> CSV</button>
                                <button onClick={() => handleDownloadList('subscribers', 'csv')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> Excel</button>
                                <button onClick={() => handleDownloadList('subscribers', 'pdf')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-brand-text-secondary">Select a community to generate a detailed report.</p>
                </div>
            )}
        </div>
    );
};