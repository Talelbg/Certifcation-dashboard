import React, { useState, useCallback, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { DeveloperRecord, DateRange, CommunityMetaData, Event } from './types';
import { FileUpload } from './components/FileUpload';
import { MetricsDashboard } from './components/MetricsDashboard';
import { ProgressByCommunityTable } from './components/ProgressByCommunityTable';
import { EmailManager } from './components/EmailManager';
import { ReportGenerator } from './components/ReportGenerator';
import { MembershipDashboard } from './components/MembershipDashboard';
import { EventsDashboard } from './components/EventsDashboard';
import { CommunityReport } from './components/CommunityReport';
import { useFilters } from './hooks/useFilters';
import { useCommunityData } from './hooks/useCommunityData';
import { useDeveloperMetrics } from './hooks/useDeveloperMetrics';
import { DownloadIcon, ShieldExclamationIcon } from './components/icons';

const RapidCompletionReport = ({ developers }: { developers: DeveloperRecord[] }) => {
    const reportTableRef = useRef<HTMLTableElement>(null);

    const calculateDuration = (dev: DeveloperRecord): string => {
        if (!dev.completedAt) return 'N/A';
        const diffMs = dev.completedAt.getTime() - dev.enrollmentDate.getTime();
        return (diffMs / (1000 * 60 * 60)).toFixed(2) + ' hours';
    };

    const handleDownload = async (format: 'csv' | 'pdf') => {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `rapid_completions_${timestamp}`;

        if (format === 'csv') {
            const dataForCsv = developers.map(dev => ({
                'Developer ID': dev.developerId,
                'First Name': dev.firstName,
                'Last Name': dev.lastName,
                'Community': dev.communityCode,
                'Country': dev.country,
                'Enrollment Date': dev.enrollmentDate.toISOString(),
                'Completion Date': dev.completedAt?.toISOString() || 'N/A',
                'Completion Duration': calculateDuration(dev),
            }));
            const csv = Papa.unparse(dataForCsv);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        if (format === 'pdf') {
            const tableElement = reportTableRef.current;
            if (!tableElement) return;

            const canvas = await html2canvas(tableElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${filename}.pdf`);
        }
    };

    return (
        <div className="bg-brand-surface p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <ShieldExclamationIcon className="h-6 w-6 mr-3 text-red-400" />
                    <div>
                        <h3 className="font-bold text-lg text-brand-text">Rapid Completion Report</h3>
                        <p className="text-sm text-brand-text-secondary">Developers who completed certification in less than 5 hours.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handleDownload('csv')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> CSV</button>
                    <button onClick={() => handleDownload('pdf')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> PDF</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table ref={reportTableRef} className="w-full text-sm text-left text-brand-text-secondary bg-brand-surface">
                    <thead className="text-xs text-brand-text uppercase bg-brand-bg">
                        <tr>
                            <th scope="col" className="px-6 py-3">Developer ID</th>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Community</th>
                            <th scope="col" className="px-6 py-3">Country</th>
                            <th scope="col" className="px-6 py-3">Enrollment Date</th>
                            <th scope="col" className="px-6 py-3">Completion Date</th>
                            <th scope="col" className="px-6 py-3">Completion Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {developers.map((dev) => (
                            <tr key={dev.developerId} className="border-b border-brand-border hover:bg-brand-border/50">
                                <td className="px-6 py-4 font-medium text-brand-text">{dev.developerId}</td>
                                <td className="px-6 py-4">{dev.firstName} {dev.lastName}</td>
                                <td className="px-6 py-4">{dev.communityCode}</td>
                                <td className="px-6 py-4">{dev.country}</td>
                                <td className="px-6 py-4">{new Date(dev.enrollmentDate).toLocaleString()}</td>
                                <td className="px-6 py-4">{dev.completedAt ? new Date(dev.completedAt).toLocaleString() : 'N/A'}</td>
                                <td className="px-6 py-4">{calculateDuration(dev)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {developers.length === 0 && <p className="text-center py-8">No rapid completions detected in the dataset.</p>}
            </div>
        </div>
    );
};

// Helper to format dates to YYYY-MM-DD using local time to prevent UTC shifting
const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const FilterControls = ({
  dateRange,
  onDateChange,
}: {
  dateRange: DateRange;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>, field: 'from' | 'to') => void;
}) => {
    return (
        <div className="flex items-center space-x-4">
            <input 
                type="date" 
                value={formatDateForInput(dateRange.from)} 
                onChange={e => onDateChange(e, 'from')} 
                className="bg-brand-surface border border-brand-border rounded px-2 py-1.5" 
            />
            <span className="text-brand-text-secondary">to</span>
            <input 
                type="date" 
                value={formatDateForInput(dateRange.to)} 
                onChange={e => onDateChange(e, 'to')} 
                className="bg-brand-surface border border-brand-border rounded px-2 py-1.5" 
            />
        </div>
    );
};

type Tab = 'dashboard' | 'management' | 'email' | 'membership' | 'events' | 'reporting' | 'audits';

const TabButton = ({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  const activeClasses = 'border-brand-primary text-brand-primary';
  const inactiveClasses = 'border-transparent text-brand-text-secondary hover:text-brand-text hover:border-gray-500';
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
    >
      {label}
    </button>
  );
};

function App() {
  const [developerData, setDeveloperData] = useState<DeveloperRecord[]>([]);
  const [communityMetaData, setCommunityMetaData] = useState<Record<string, CommunityMetaData>>({});
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [events, setEvents] = useState<Event[]>([
      {id: '1', name: 'Community Leaders Summit', date: '2024-08-15', description: 'Annual summit for all community leaders.', type: 'upcoming'},
      {id: '2', name: 'Q2 Hackathon', date: '2024-06-20', description: 'A week-long virtual hackathon.', type: 'past'},
  ]);

  const { dateRange, handleDateChange, setInitialDateRange } = useFilters();

  // Filter developerData based on the selected dateRange for periodic analysis
  const filteredDeveloperData = useMemo(() => {
    return developerData.filter(dev => {
      const devDate = dev.enrollmentDate.getTime();
      const from = dateRange.from?.getTime();
      const to = dateRange.to?.getTime();
      if (from && devDate < from) return false;
      if (to && devDate > to) return false;
      return true;
    });
  }, [developerData, dateRange]);

  const { processedCommunityData, topPerformingCommunities, overallAverageCompletionDays } = useCommunityData(developerData, dateRange, communityMetaData);
  const { potentialFakeAccounts, rapidCompletions } = useDeveloperMetrics(filteredDeveloperData);


  const handleSaveEvent = (event: Omit<Event, 'id'>, id?: string) => {
      setEvents(prev => {
          const updatedEvent = { ...event, date: event.date || new Date().toISOString().split('T')[0] };
          
          if (id) {
              return prev.map(e => e.id === id ? { ...updatedEvent, id } : e);
          } else {
              return [...prev, { ...updatedEvent, id: Date.now().toString() }];
          }
      });
  };

  const handleDeleteEvent = (eventId: string) => {
      setEvents(prev => prev.filter(e => e.id !== eventId));
  };


  const handleDataLoaded = useCallback((data: DeveloperRecord[]) => {
    setDeveloperData(data);
    setFileUploadError(null);
    setActiveTab('dashboard'); 
    setInitialDateRange(data);
  }, [setInitialDateRange]);

  const handleToggleImportant = (communityCode: string) => {
    setCommunityMetaData(prev => ({
      ...prev,
      [communityCode]: {
        ...prev[communityCode] || { isImportant: false, followUpDate: null },
        isImportant: !prev[communityCode]?.isImportant,
      }
    }));
  };

  const handleSetFollowUp = (communityCode: string, date: string) => {
    setCommunityMetaData(prev => ({
      ...prev,
      [communityCode]: {
        ...prev[communityCode] || { isImportant: false, followUpDate: null },
        followUpDate: date,
      }
    }));
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <h1 className="text-3xl font-bold text-brand-text">Developer Community Dashboard</h1>
          <div className="flex items-center space-x-4">
             <FilterControls dateRange={dateRange} onDateChange={handleDateChange} />
             <ReportGenerator data={processedCommunityData} />
          </div>
        </header>

        <div className="bg-brand-surface p-4 rounded-lg shadow-lg">
            <FileUpload onDataLoaded={handleDataLoaded} setFileUploadError={setFileUploadError} />
            {fileUploadError && <p className="text-red-400 mt-2 text-sm">{fileUploadError}</p>}
        </div>

        {developerData.length > 0 ? (
            <div>
                <div className="border-b border-brand-border">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                        <TabButton label="Community Management" isActive={activeTab === 'management'} onClick={() => setActiveTab('management')} />
                        <TabButton label="Email Campaigns" isActive={activeTab === 'email'} onClick={() => setActiveTab('email')} />
                        <TabButton label="Membership Program" isActive={activeTab === 'membership'} onClick={() => setActiveTab('membership')} />
                        <TabButton label="Events" isActive={activeTab === 'events'} onClick={() => setActiveTab('events')} />
                        <TabButton label="Reporting" isActive={activeTab === 'reporting'} onClick={() => setActiveTab('reporting')} />
                        <TabButton label="Audits & Security" isActive={activeTab === 'audits'} onClick={() => setActiveTab('audits')} />
                    </nav>
                </div>
                <div className="mt-6">
                    {activeTab === 'dashboard' && <MetricsDashboard data={processedCommunityData} developerData={filteredDeveloperData} topPerformingCommunities={topPerformingCommunities} overallAverageCompletionDays={overallAverageCompletionDays} potentialFakeAccounts={potentialFakeAccounts} rapidCompletionsCount={rapidCompletions.count} />}
                    {activeTab === 'management' && (
                        <div>
                            <div className="mb-4 p-4 bg-brand-bg rounded-lg border border-brand-border">
                                <p className="text-sm text-brand-text-secondary">
                                    Analysis Period: <span className="font-semibold text-brand-text">{formatDate(dateRange.from)}</span> to <span className="font-semibold text-brand-text">{formatDate(dateRange.to)}</span>
                                </p>
                            </div>
                            <ProgressByCommunityTable data={processedCommunityData} onToggleImportant={handleToggleImportant} onSetFollowUp={handleSetFollowUp} />
                        </div>
                    )}
                    {activeTab === 'email' && <EmailManager communities={processedCommunityData} developerData={filteredDeveloperData} />}
                    {activeTab === 'membership' && <MembershipDashboard developerData={filteredDeveloperData} />}
                    {activeTab === 'events' && <EventsDashboard events={events} onSave={handleSaveEvent} onDelete={handleDeleteEvent} />}
                    {activeTab === 'reporting' && <CommunityReport communities={processedCommunityData} dateRange={dateRange} />}
                    {activeTab === 'audits' && <RapidCompletionReport developers={rapidCompletions.developers} />}
                </div>
            </div>
        ) : (
            <div className="text-center py-16 bg-brand-surface rounded-lg">
                <h2 className="text-xl font-semibold text-brand-text">Welcome, Community Manager!</h2>
                <p className="text-brand-text-secondary mt-2">Upload a developer data CSV to begin analyzing community progress.</p>
            </div>
        )}

      </div>
    </div>
  );
}

export default App;