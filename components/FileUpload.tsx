import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { DeveloperRecord } from '../types';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onDataLoaded: (data: DeveloperRecord[]) => void;
  setFileUploadError: (error: string | null) => void;
}

const REQUIRED_HEADERS = [
    'Email', 'Code', 'Country', 'Percentage Completed', 'Created At', 'Accepted Marketing', 'Accepted Membership', 'Completed At'
];

export const FileUpload = ({ onDataLoaded, setFileUploadError }: FileUploadProps) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileUploadError(null);
    setFileName(file.name);

    if (!file.name.endsWith('.csv')) {
        setFileUploadError('Invalid file format. Please upload a CSV file.');
        setFileName(null);
        return;
    }

    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          setFileUploadError(`Missing required headers: ${missingHeaders.join(', ')}`);
          setFileName(null);
          return;
        }

        try {
          const hasFirstName = headers.includes('First Name');
          const hasLastName = headers.includes('Last Name');

          const parsedData: DeveloperRecord[] = results.data.map((row, index) => {
            const progress = parseInt(row['Percentage Completed'], 10);
            if (isNaN(progress) || progress < 0 || progress > 100) {
                throw new Error(`Invalid 'Percentage Completed' at row ${index + 2}: ${row['Percentage Completed']}`);
            }

            const enrollmentDate = new Date(row['Created At']);
            if (isNaN(enrollmentDate.getTime())) {
                throw new Error(`Invalid 'Created At' date at row ${index + 2}: ${row['Created At']}`);
            }

            const completedAtString = row['Completed At'];
            let completedAtDate: Date | null = null;
            if (completedAtString) {
                completedAtDate = new Date(completedAtString);
                if (isNaN(completedAtDate.getTime())) {
                     throw new Error(`Invalid 'Completed At' date at row ${index + 2}: ${completedAtString}`);
                }
            }
            
            const acceptedMarketing = row['Accepted Marketing']?.toLowerCase();
            const subscribed = acceptedMarketing === 'true' || acceptedMarketing === 'yes' || acceptedMarketing === '1';

            const acceptedMembershipRaw = row['Accepted Membership']?.toLowerCase();
            const acceptedMembership = acceptedMembershipRaw === 'true' || acceptedMembershipRaw === 'yes' || acceptedMembershipRaw === '1';
            
            let firstName = '';
            let lastName = '';

            if (hasFirstName && row['First Name']) {
                firstName = row['First Name'].trim();
            }
            if (hasLastName && row['Last Name']) {
                lastName = row['Last Name'].trim();
            }

            // Fallback to derive name from email if not present in CSV
            if (!firstName && row['Email']) {
                try {
                    const emailNamePart = row['Email'].split('@')[0];
                    const nameParts = emailNamePart.replace(/[\._-]/g, ' ').split(' ').filter(p => p.length > 0);
                    
                    if (nameParts.length > 0) {
                        firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
                    }
                    if (nameParts.length > 1) {
                        lastName = nameParts[nameParts.length - 1].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].slice(1);
                    }
                } catch (e) {
                    // Ignore if email format is weird, names will be blank
                }
            }

            return {
              developerId: row['Email'],
              firstName,
              lastName,
              communityCode: row['Code'],
              country: row['Country']?.trim() || 'Unknown',
              certificationProgress: progress,
              enrollmentDate: enrollmentDate,
              completedAt: completedAtDate,
              subscribed: subscribed,
              acceptedMembership: acceptedMembership, 
              certified: progress === 100
            };
          });
          onDataLoaded(parsedData);
        } catch (error: any) {
            setFileUploadError(`Error processing data: ${error.message}`);
            setFileName(null);
        }
      },
      error: (error: any) => {
        setFileUploadError(`CSV parsing error: ${error.message}`);
        setFileName(null);
      }
    });
  }, [onDataLoaded, setFileUploadError]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      <button
        onClick={handleButtonClick}
        className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
      >
        <UploadIcon />
        {fileName ? `Loaded: ${fileName}` : 'Upload Developer CSV'}
      </button>
    </div>
  );
};