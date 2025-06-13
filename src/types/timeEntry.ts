export interface TimeEntry {
  id: string; // We'll generate this
  project: string;
  client: string;
  description: string;
  task: string;
  user: string;
  group: string;
  email: string;
  tags: string;
  billable: boolean;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  timeHours: string; // Duration (h)
  timeDecimal: number; // Duration (decimal)
  billableRate: number;
  billableAmount: number;
  // Computed fields
  amount: number; // This will be calculated based on our hourly rate
  date: Date; // We'll use startDate for this
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
