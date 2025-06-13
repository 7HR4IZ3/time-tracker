import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimeEntry } from "@/types/timeEntry";

interface DataTableProps {
  timeEntries: TimeEntry[];
}

type SortField =
  | "startDate"
  | "project"
  | "client"
  | "timeDecimal"
  | "amount"
  | "description";
type SortDirection = "asc" | "desc";

const DataTable = ({ timeEntries }: DataTableProps) => {
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const formatDate = (date: Date | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const sortedEntries = useMemo(() => {
    return [...timeEntries].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [timeEntries, sortField, sortDirection]);

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEntries, currentPage]);

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      {children}
      {sortField === field &&
        (sortDirection === "asc" ? (
          <ChevronUp className="ml-1 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-1 h-4 w-4" />
        ))}
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Entries Data</CardTitle>
        <p className="text-sm text-muted-foreground">
          Showing {paginatedEntries.length} of {timeEntries.length} entries
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="startDate">Date</SortButton>
                </TableHead>
                {/* <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead> */}
                <TableHead>
                  <SortButton field="project">Project</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="client">Client</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="description">Description</SortButton>
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>
                  <SortButton field="timeDecimal">Hours</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="amount">Amount</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/50">
                  <TableCell>{formatDate(entry.startDate)}</TableCell>
                  {/* <TableCell className="font-mono text-sm">
                    {entry.startTime}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {entry.endTime}
                  </TableCell> */}
                  <TableCell>
                    <Badge variant="outline">{entry.project}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{entry.client}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted">
                      {entry.user}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {entry.timeHours}
                  </TableCell>
                  <TableCell className="font-mono">
                    {entry.timeDecimal.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-green-600">
                    ${entry.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;
