
import { useState, useMemo } from 'react';
import { Upload, Filter, FileText, BarChart3, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataFilters from './DataFilters';
import TimeCharts from './TimeCharts';
import DataTable from './DataTable';
import InvoiceGenerator from './InvoiceGenerator';
import ExportData from './ExportData';
import TimeRounding from './TimeRounding';
import { TimeEntry, FilterOptions } from '@/types/timeEntry';

interface DashboardProps {
  timeEntries: TimeEntry[];
  onNewData: () => void;
}

const Dashboard = ({ timeEntries, onNewData }: DashboardProps) => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [currentEntries, setCurrentEntries] = useState<TimeEntry[]>(timeEntries);

  const filteredEntries = useMemo(() => {
    return currentEntries.filter(entry => {
      // Search filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        if (
          !entry.project.toLowerCase().includes(searchTerm) &&
          !entry.client.toLowerCase().includes(searchTerm) &&
          !entry.description.toLowerCase().includes(searchTerm)
        ) {
          return false;
        }
      }

      // Project filter
      if (filters.projects?.length && !filters.projects.includes(entry.project)) {
        return false;
      }

      // Client filter
      if (filters.clients?.length && !filters.clients.includes(entry.client)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange && entry.date) {
        if (entry.date < filters.dateRange.start || entry.date > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [currentEntries, filters]);

  const handleEntriesUpdate = (updatedEntries: TimeEntry[]) => {
    setCurrentEntries(updatedEntries);
  };

  // Summary statistics
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.timeDecimal, 0);
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const uniqueProjects = new Set(filteredEntries.map(entry => entry.project)).size;
  const uniqueClients = new Set(filteredEntries.map(entry => entry.client)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              TimeTracker Analytics
            </h1>
            <p className="text-muted-foreground">
              {filteredEntries.length} entries • {totalHours.toFixed(2)} hours • ${totalAmount.toFixed(2)}
            </p>
          </div>
          <Button onClick={onNewData} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload New Data
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-primary">{totalHours.toFixed(1)}h</div>
            <div className="text-sm text-muted-foreground">Total Hours</div>
          </div>
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-green-600">${totalAmount.toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{uniqueProjects}</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </div>
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{uniqueClients}</div>
            <div className="text-sm text-muted-foreground">Clients</div>
          </div>
        </div>

        {/* Filters */}
        <DataFilters 
          timeEntries={currentEntries} 
          filters={filters} 
          onFiltersChange={setFilters} 
        />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="flex items-center gap-2">
              <span className="hidden sm:inline">Adjustments</span>
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Invoice</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <TimeCharts timeEntries={filteredEntries} />
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <DataTable timeEntries={filteredEntries} />
          </TabsContent>

          <TabsContent value="adjustments" className="space-y-6">
            <TimeRounding 
              timeEntries={currentEntries} 
              onEntriesUpdate={handleEntriesUpdate}
            />
          </TabsContent>

          <TabsContent value="invoice" className="space-y-6">
            <InvoiceGenerator timeEntries={filteredEntries} />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportData timeEntries={filteredEntries} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
