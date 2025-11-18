// FIX: Define and export all necessary types for the application.
export interface DeveloperRecord {
  developerId: string;
  firstName: string;
  lastName: string;
  communityCode: string;
  country: string;
  certificationProgress: number;
  enrollmentDate: Date;
  subscribed: boolean;
  acceptedMembership: boolean;
  certified: boolean;
  completedAt?: Date | null;
}

export interface Community {
  code: string;
  developerCount: number;
  subscribedCount: number;
  certifiedCount: number;
  averageProgress: number;
  averageCompletionDays: number | null;
  developers: DeveloperRecord[];
}

export interface CommunityMetaData {
  isImportant: boolean;
  followUpDate: string | null;
}

export interface CommunityWithMetadata extends Community {
  meta: CommunityMetaData;
  hasRapidCompletions: boolean;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface Event {
    id: string;
    name: string;
    date: string;
    description: string;
    type: 'upcoming' | 'past';
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
}