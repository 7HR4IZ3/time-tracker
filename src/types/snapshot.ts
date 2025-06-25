import { TimeEntry, FilterOptions } from './timeEntry';

export interface AppSnapshot {
  id?: string;
  title?: string;
  description?: string;
  createdAt?: string;
  
  // App data
  timeEntries: TimeEntry[];
  
  // Settings
  defaultHourlyRate: number;
  defaultRoundingInterval: 15 | 30 | 60;
  
  // Current state
  currentFilters?: FilterOptions;
  activeView?: 'dashboard' | 'analytics' | 'invoice';
  
  // Invoice state (if on invoice page)
  invoiceState?: {
    selectedClient?: string;
    hourlyRate?: number;
    invoiceNumber?: string;
    companyDetails?: {
      name: string;
      address: string;
      email: string;
      phone: string;
    };
  };
  
  // UI preferences
  uiState?: {
    darkMode?: boolean;
    sidebarCollapsed?: boolean;
  };
}

export interface ShareableSnapshot extends Omit<AppSnapshot, 'id' | 'createdAt'> {
  // For sharing, we don't include database-specific fields
}
