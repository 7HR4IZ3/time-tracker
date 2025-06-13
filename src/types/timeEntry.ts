
export interface TimeEntry {
  id: string;
  project: string;
  client: string;
  description: string;
  timeHours: string;
  timeDecimal: number;
  amount: number;
  date?: Date;
  category?: string;
}

export interface TimeRoundingOptions {
  interval: 15 | 30 | 60; // minutes
}

export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  projects?: string[];
  clients?: string[];
  searchTerm?: string;
}

export interface InvoiceData {
  client: string;
  entries: TimeEntry[];
  totalHours: number;
  totalAmount: number;
  hourlyRate?: number;
}
