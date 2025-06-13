
import { useState } from 'react';
import { Search, Calendar, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeEntry, FilterOptions } from '@/types/timeEntry';

interface DataFiltersProps {
  timeEntries: TimeEntry[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const DataFilters = ({ timeEntries, filters, onFiltersChange }: DataFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');

  const uniqueProjects = [...new Set(timeEntries.map(entry => entry.project))].sort();
  const uniqueClients = [...new Set(timeEntries.map(entry => entry.client))].sort();

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFiltersChange({ ...filters, searchTerm: value || undefined });
  };

  const handleProjectFilter = (project: string) => {
    const currentProjects = filters.projects || [];
    const newProjects = currentProjects.includes(project)
      ? currentProjects.filter(p => p !== project)
      : [...currentProjects, project];
    
    onFiltersChange({ 
      ...filters, 
      projects: newProjects.length > 0 ? newProjects : undefined 
    });
  };

  const handleClientFilter = (client: string) => {
    const currentClients = filters.clients || [];
    const newClients = currentClients.includes(client)
      ? currentClients.filter(c => c !== client)
      : [...currentClients, client];
    
    onFiltersChange({ 
      ...filters, 
      clients: newClients.length > 0 ? newClients : undefined 
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFiltersChange({});
  };

  const hasActiveFilters = filters.searchTerm || filters.projects?.length || filters.clients?.length;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search projects, clients, or descriptions..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Projects</label>
          <Select onValueChange={handleProjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              {uniqueProjects.map(project => (
                <SelectItem key={project} value={project}>
                  {project}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Clients</label>
          <Select onValueChange={handleClientFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              {uniqueClients.map(client => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.projects?.map(project => (
            <Badge key={project} variant="secondary" className="cursor-pointer" onClick={() => handleProjectFilter(project)}>
              Project: {project}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          {filters.clients?.map(client => (
            <Badge key={client} variant="secondary" className="cursor-pointer" onClick={() => handleClientFilter(client)}>
              Client: {client}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataFilters;
