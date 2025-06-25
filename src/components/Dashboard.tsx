import { useState, useMemo, useEffect } from "react";
import {
  Upload,
  Filter,
  FileText,
  BarChart3,
  Table,
  Settings,
  Share,
  Clock,
  DollarSign,
  Timer,
  FolderOpen,
  Users,
  Download,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import DataFilters from "./DataFilters";
import TimeCharts from "./TimeCharts";
import DataTable from "./DataTable";
import InvoiceGenerator from "./InvoiceGenerator";
import ExportData from "./ExportData";
import TimeRounding from "./TimeRounding";

import { TimeEntry, FilterOptions } from "@/types/timeEntry";
import { cn } from "@/lib/utils";
import { createFilterUrl } from "@/utils/urlParams";
import { ShareButton } from "./ShareButton";
import { SnapshotService } from "@/services/snapshotService";

interface DashboardProps {
  timeEntries: TimeEntry[];
  onNewData: () => void;
  defaultHourlyRate?: number;
  defaultRoundingInterval?: 15 | 30 | 60;
  initialFilters?: FilterOptions;
}

const Dashboard = ({
  timeEntries,
  onNewData,
  defaultHourlyRate = 75,
  defaultRoundingInterval = 15,
  initialFilters = {},
}: DashboardProps) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [currentEntries, setCurrentEntries] =
    useState<TimeEntry[]>(timeEntries);
  const [hourlyRate, setHourlyRate] = useState<number>(defaultHourlyRate);
  const [roundingInterval, setRoundingInterval] = useState<15 | 30 | 60>(
    defaultRoundingInterval
  );
  const [showSettings, setShowSettings] = useState(false);

  const { toast } = useToast();

  const timeStringToDecimal = (timeString: string): number => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return hours + minutes / 60 + (seconds || 0) / 3600;
  };

  const roundTime = (time: number | string, interval: 15 | 30 | 60): number => {
    let timeDecimal: number;

    if (typeof time === "string") {
      timeDecimal = timeStringToDecimal(time);
    } else {
      timeDecimal = time;
    }

    const intervalInHours = interval / 60;
    return Math.ceil(timeDecimal / intervalInHours) * intervalInHours;
  };

  const applyTimeRounding = () => {
    const updatedEntries = currentEntries.map((entry) => {
      const roundedTime = roundTime(
        typeof entry.timeHours === "string"
          ? entry.timeHours
          : entry.timeDecimal,
        roundingInterval
      );

      return {
        ...entry,
        timeDecimal: roundedTime,
        amount: roundedTime * hourlyRate,
      };
    });

    setCurrentEntries(updatedEntries);
    toast({
      title: "Time Rounding Applied",
      description: `Time entries rounded to ${roundingInterval} minute intervals`,
    });
  };

  const recalculateAmounts = () => {
    const updatedEntries = currentEntries.map((entry) => ({
      ...entry,
      amount: entry.timeDecimal * hourlyRate,
    }));

    setCurrentEntries(updatedEntries);
    toast({
      title: "Amounts Recalculated",
      description: `All amounts updated with $${hourlyRate}/hour rate`,
    });
  };

  const getCurrentSnapshot = () => {
    return SnapshotService.createSnapshot(
      filteredEntries,
      {
        defaultHourlyRate: hourlyRate,
        defaultRoundingInterval: roundingInterval,
        currentFilters: filters,
      },
      {
        title: `TimeTracker Snapshot - ${new Date().toLocaleDateString()}`,
        description: `Snapshot with ${filteredEntries.length} entries, filtered data, and current settings.`,
        activeView: 'dashboard',
      }
    );
  };



  const isWithinDateRange = (
    entry: TimeEntry,
    range: { start?: Date; end?: Date }
  ) => {
    if (!range.start || !range.end) return true;

    const startDate = new Date(range.start.setHours(0, 0, 0, 0));
    const endDate = new Date(range.end.setHours(23, 59, 59, 999));
    const entryDate = new Date(entry.startDate.setHours(0, 0, 0, 0));

    return entryDate >= startDate && entryDate <= endDate;
  };

  const filteredEntries = useMemo(() => {
    return currentEntries.filter((entry) => {
      // Date range filter
      if (filters.dateRange?.start && filters.dateRange?.end) {
        if (!isWithinDateRange(entry, filters.dateRange)) {
          return false;
        }
      }

      // Search filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        if (
          !entry.project.toLowerCase().includes(searchTerm) &&
          !entry.client.toLowerCase().includes(searchTerm) &&
          !entry.description.toLowerCase().includes(searchTerm) &&
          !entry.user.toLowerCase().includes(searchTerm)
        ) {
          return false;
        }
      }

      // Project filter
      if (
        filters.projects?.length &&
        !filters.projects.includes(entry.project)
      ) {
        return false;
      }

      // Client filter
      if (filters.clients?.length && !filters.clients.includes(entry.client)) {
        return false;
      }

      return true;
    });
  }, [currentEntries, filters]);

  const summaryStats = useMemo(() => {
    return filteredEntries.reduce(
      (stats, entry) => ({
        totalHours: stats.totalHours + entry.timeDecimal,
        totalAmount: stats.totalAmount + entry.amount,
        billableHours:
          stats.billableHours + (entry.billable ? entry.timeDecimal : 0),
        uniqueProjects: stats.uniqueProjects.add(entry.project),
        uniqueClients: stats.uniqueClients.add(entry.client),
      }),
      {
        totalHours: 0,
        totalAmount: 0,
        billableHours: 0,
        uniqueProjects: new Set<string>(),
        uniqueClients: new Set<string>(),
      }
    );
  }, [filteredEntries]);

  const handleEntriesUpdate = (updatedEntries: TimeEntry[]) => {
    setCurrentEntries(updatedEntries);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);

    // Update URL with new filters
    const currentParams = new URLSearchParams(window.location.search);
    const filterParams = new URLSearchParams(createFilterUrl(newFilters));

    // Preserve non-filter params
    ["url", "rate", "interval"].forEach((param) => {
      const value = currentParams.get(param);
      if (value) filterParams.set(param, value);
    });

    const newUrl = `${window.location.pathname}?${filterParams.toString()}`;
    window.history.replaceState({}, "", newUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 p-4 lg:p-8">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                TimeTracker Analytics
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary">
                  {filteredEntries.length} entries
                </span>
                <span className="px-2 py-1 rounded-md bg-secondary/10 text-secondary">
                  {summaryStats.totalHours.toFixed(2)} hours
                </span>
                <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-500">
                  ${summaryStats.totalAmount.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareButton 
                snapshot={getCurrentSnapshot()} 
                variant="outline" 
                size="sm" 
              />
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button onClick={onNewData} variant="default" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Summary Cards - Moved inside header card */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <SummaryCard
              title="Total Hours"
              value={`${summaryStats.totalHours.toFixed(1)}h`}
              icon={<Clock className="w-4 h-4" />}
              className="bg-primary/10"
            />
            <SummaryCard
              title="Total Amount"
              value={`$${summaryStats.totalAmount.toFixed(0)}`}
              icon={<DollarSign className="w-4 h-4" />}
              className="bg-green-500/10"
            />
            <SummaryCard
              title="Billable Hours"
              value={`${summaryStats.billableHours.toFixed(1)}h`}
              icon={<Timer className="w-4 h-4" />}
              className="bg-blue-500/10"
            />
            <SummaryCard
              title="Projects"
              value={summaryStats.uniqueProjects.size.toString()}
              icon={<FolderOpen className="w-4 h-4" />}
              className="bg-purple-500/10"
            />
            <SummaryCard
              title="Clients"
              value={summaryStats.uniqueClients.size.toString()}
              icon={<Users className="w-4 h-4" />}
              className="bg-orange-500/10"
            />
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Rate Settings */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="hourlyRateInput"
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        Hourly Rate
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="hourlyRateInput"
                          type="number"
                          value={hourlyRate}
                          onChange={(e) =>
                            setHourlyRate(Number(e.target.value))
                          }
                          className="pl-9"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={recalculateAmounts}
                      variant="outline"
                      className="w-full"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Recalculate Amounts
                    </Button>
                  </div>

                  {/* Time Rounding */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="roundingSelect"
                        className="flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Time Rounding
                      </Label>
                      <Select
                        value={roundingInterval.toString()}
                        onValueChange={(value) =>
                          setRoundingInterval(Number(value) as 15 | 30 | 60)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={applyTimeRounding}
                      variant="default"
                      className="w-full"
                    >
                      <Timer className="w-4 h-4 mr-2" />
                      Apply Rounding
                    </Button>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Quick Actions
                    </Label>
                    <div className="grid gap-2">
                      <ShareButton 
                        snapshot={getCurrentSnapshot()} 
                        variant="outline" 
                        className="justify-start"
                      />
                      <Button
                        variant="outline"
                        onClick={onNewData}
                        className="justify-start"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Data
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Settings Info */}
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                  <p>
                    Changes to rates and rounding will affect all calculations
                    immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <DataFilters
          timeEntries={currentEntries}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Main Content Tabs */}
        <Tabs defaultValue="table" className="space-y-6">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoice
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <TimeCharts timeEntries={filteredEntries} />
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <DataTable timeEntries={filteredEntries} />
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

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
}

const SummaryCard = ({ title, value, icon, className }: SummaryCardProps) => (
  <div className={cn("rounded-lg p-4", className)}>
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
      {icon}
      {title}
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default Dashboard;
