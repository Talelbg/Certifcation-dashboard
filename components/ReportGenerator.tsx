import React, { useRef } from 'react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CommunityWithMetadata } from '../types';
import { DownloadIcon } from './icons';

export const ReportGenerator = ({ data, fileName: baseFileName = 'developer_community_report' }: { data: CommunityWithMetadata[]; fileName?: string; }) => {
    const pdfExportRef = useRef<HTMLTableElement>(null);

    const flattenedData = data.flatMap(community =>
        community.developers.map(dev => ({
            developerId: dev.developerId,
            communityCode: dev.communityCode,
            country: dev.country,
            certificationProgress: dev.certificationProgress,
            enrollmentDate: dev.enrollmentDate.toISOString().split('T')[0],
            subscribed: dev.subscribed,
            certified: dev.certified,
            communityIsImportant: community.meta.isImportant,
            communityFollowUpDate: community.meta.followUpDate || 'N/A'
        }))
    );
    
    const handleExport = async (format: 'csv' | 'pdf') => {
        if (data.length === 0) {
            alert("No data available to export.");
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `${baseFileName}_${timestamp}`;

        if (format === 'csv') {
            const csv = Papa.unparse(flattenedData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${fileName}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        if (format === 'pdf') {
            const tableEl = pdfExportRef.current;
            if (!tableEl) return;
            
            const canvas = await html2canvas(tableEl, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${fileName}.pdf`);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <button onClick={() => handleExport('csv')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> CSV</button>
            <button onClick={() => handleExport('pdf')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 text-xs rounded-lg flex items-center transition-colors duration-200"><DownloadIcon className="h-4 w-4 mr-1"/> PDF</button>

            {/* Hidden table for PDF export */}
            <div className="absolute -left-[9999px] top-0">
                <table ref={pdfExportRef} className="text-xs bg-white text-black">
                    <thead>
                        <tr>
                            {Object.keys(flattenedData[0] || {}).map(key => <th key={key} className="p-1 border">{key}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {flattenedData.map((row, i) => (
                            <tr key={i}>
                                {Object.values(row).map((val, j) => <td key={j} className="p-1 border">{String(val)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};