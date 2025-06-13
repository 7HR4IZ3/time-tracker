
import { useState, useMemo } from 'react';
import { Calendar, Filter, Download, FileText, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeEntry, FilterOptions } from '@/types/timeEntry';
import DataFilters from '@/components/DataFilters';
import TimeCharts from '@/components/TimeCharts';
import DataTable from '@/components/DataTable';
import InvoiceGenerator from '@/components/InvoiceGenerator';
import ExportData from '@/components/ExportData';

interface DashboardProps {
  timeEntries: TimeEntry[];
  onNewData: () => void;
}

const Dashboard = ({ timeEntries, onNewData }: DashboardProps) => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [activeTab, setActiveTab] = useState('overview');

  const filteredEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        if (!entry.project.toLowerCase().includes(searchLower) &&
            !entry.client.toLowerCase().includes(searchLower) &&
            !entry.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      if (filters.projects?.length && !filters.projects.includes(entry.project)) {
        return false;
      }
      
      if (filters.clients?.length && !filters.clients.includes(entry.client)) {
        return false;
      }
      
      return true;
    });
  }, [timeEntries, filters]);

  const summaryStats = useMemo(() => {
    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.timeDecimal, 0);
    const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const uniqueProjects = new Set(filteredEntries.map(entry => entry.project)).size;
    const uniqueClients = new Set(filteredEntries.map(entry => entry.client)).size;
    
    return {
      totalHours: totalHours.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      uniqueProjects,
      uniqueClients,
      avgHourlyRate: totalHours > 0 ? (totalAmount / totalHours).toFixed(2) : '0.00'
    };
  }, [filteredEntries]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              TimeTracker Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              {timeEntries.length} entries loaded • {filteredEntries.length} shown
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={onNewData}>
              <FileText className="w-4 h-4 mr-2" />
              New Import
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summaryStats.totalHours}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${summaryStats.totalAmount}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.uniqueProjects}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.uniqueClients}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summaryStats.avgHourlyRate}/h</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataFilters 
              timeEntries={timeEntries}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data Table</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <TimeCharts timeEntries={filteredEntries} />
          </TabsContent>
          
          <TabsContent value="data" className="mt-6">
            <DataTable timeEntries={filteredEntries} />
          </TabsContent>
          
          <TabsContent value="invoices" className="mt-6">
            <InvoiceGenerator timeEntries={filteredEntries} />
          </TabsContent>
          
          <TabsContent value="export" className="mt-6">
            <ExportData timeEntries={filteredEntries} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
