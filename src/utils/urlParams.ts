import { FilterOptions } from "@/types/timeEntry";

export const parseFilterParams = (
  searchParams: URLSearchParams
): FilterOptions => {
  const filters: FilterOptions = {};

  // Search term
  const search = searchParams.get("search");
  if (search) filters.searchTerm = search;

  // Projects
  const projects = searchParams.get("projects");
  if (projects) filters.projects = projects.split(",");

  // Clients
  const clients = searchParams.get("clients");
  if (clients) filters.clients = clients.split(",");

  // Date range
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (startDate || endDate) {
    filters.dateRange = {
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    };
  }

  return filters;
};

export const createFilterUrl = (filters: FilterOptions): string => {
  const params = new URLSearchParams();

  if (filters.searchTerm) params.set("search", filters.searchTerm);
  if (filters.projects?.length)
    params.set("projects", filters.projects.join(","));
  if (filters.clients?.length) params.set("clients", filters.clients.join(","));
  if (filters.dateRange?.start)
    params.set("startDate", filters.dateRange.start.toISOString());
  if (filters.dateRange?.end)
    params.set("endDate", filters.dateRange.end.toISOString());

  return params.toString();
};
