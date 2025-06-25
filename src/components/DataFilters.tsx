import { useState } from "react";
import { Search, Calendar, X, FolderOpen, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TimeEntry, FilterOptions } from "@/types/timeEntry";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface DataFiltersProps {
  timeEntries: TimeEntry[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const DataFilters = ({
  timeEntries,
  filters,
  onFiltersChange,
}: DataFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || "");

  const uniqueProjects = [
    ...new Set(timeEntries.map((entry) => entry.project)),
  ].sort();
  const uniqueClients = [
    ...new Set(timeEntries.map((entry) => entry.client)),
  ].sort();

  // Helper function to safely format dates
  const formatDateSafely = (dateValue: any): string => {
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toISOString().split("T")[0];
    } catch {
      return 'Invalid Date';
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFiltersChange({ ...filters, searchTerm: value || undefined });
  };

  const handleProjectFilter = (project: string) => {
    const currentProjects = filters.projects || [];
    const newProjects = currentProjects.includes(project)
      ? currentProjects.filter((p) => p !== project)
      : [...currentProjects, project];

    onFiltersChange({
      ...filters,
      projects: newProjects.length > 0 ? newProjects : undefined,
    });
  };

  const handleClientFilter = (client: string) => {
    const currentClients = filters.clients || [];
    const newClients = currentClients.includes(client)
      ? currentClients.filter((c) => c !== client)
      : [...currentClients, client];

    onFiltersChange({
      ...filters,
      clients: newClients.length > 0 ? newClients : undefined,
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: range
        ? {
            start: range.from || undefined,
            end: range.to || undefined,
          }
        : undefined,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.searchTerm ||
    filters.projects?.length ||
    filters.clients?.length ||
    filters.dateRange?.start ||
    filters.dateRange?.end;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Main Filters Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Entries
              </Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Search in all fields..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </Label>
              <DateRangePicker
                date={
                  filters.dateRange
                    ? {
                        from: filters.dateRange.start,
                        to: filters.dateRange.end,
                      }
                    : undefined
                }
                onDateChange={handleDateRangeChange}
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projects */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Projects
              </Label>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {uniqueProjects.map((project) => (
                    <Badge
                      key={project}
                      variant={
                        filters.projects?.includes(project)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/90 transition-colors"
                      onClick={() => handleProjectFilter(project)}
                    >
                      {project}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Clients */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clients
              </Label>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {uniqueClients.map((client) => (
                    <Badge
                      key={client}
                      variant={
                        filters.clients?.includes(client)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/90 transition-colors"
                      onClick={() => handleClientFilter(client)}
                    >
                      {client}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <Label className="text-sm font-medium">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.projects?.map((project) => (
                  <Badge
                    key={project}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleProjectFilter(project)}
                  >
                    Project: {project}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.clients?.map((client) => (
                  <Badge
                    key={client}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleClientFilter(client)}
                  >
                    Client: {client}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.dateRange?.start && (
                  <Badge variant="secondary" className="cursor-pointer">
                    Start Date: {formatDateSafely(filters.dateRange.start)}
                  </Badge>
                )}
                {filters.dateRange?.end && (
                  <Badge variant="secondary" className="cursor-pointer">
                    End Date: {formatDateSafely(filters.dateRange.end)}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataFilters;
