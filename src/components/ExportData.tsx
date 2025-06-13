
import { Download, FileText, Table } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeEntry } from '@/types/timeEntry';

interface ExportDataProps {
  timeEntries: TimeEntry[];
}

const ExportData = ({ timeEntries }: ExportDataProps) => {
  const exportToCSV = () => {
    const headers = ['Project', 'Client', 'Description', 'Time (h)', 'Time (decimal)', 'Amount (USD)'];
    const csvContent = [
      headers.join(','),
      ...timeEntries.map(entry => [
        `"${entry.project}"`,
        `"${entry.client}"`,
        `"${entry.description}"`,
        `"${entry.timeHours}"`,
        entry.timeDecimal,
        entry.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(timeEntries, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummary = () => {
    const summary = {
      exportDate: new Date().toISOString(),
      totalEntries: timeEntries.length,
      totalHours: timeEntries.reduce((sum, entry) => sum + entry.timeDecimal, 0),
      totalAmount: timeEntries.reduce((sum, entry) => sum + entry.amount, 0),
      projects: [...new Set(timeEntries.map(entry => entry.project))],
      clients: [...new Set(timeEntries.map(entry => entry.client))],
      projectBreakdown: timeEntries.reduce((acc, entry) => {
        if (!acc[entry.project]) {
          acc[entry.project] = { hours: 0, amount: 0, entries: 0 };
        }
        acc[entry.project].hours += entry.timeDecimal;
        acc[entry.project].amount += entry.amount;
        acc[entry.project].entries += 1;
        return acc;
      }, {} as Record<string, any>),
      clientBreakdown: timeEntries.reduce((acc, entry) => {
        if (!acc[entry.client]) {
          acc[entry.client] = { hours: 0, amount: 0, entries: 0 };
        }
        acc[entry.client].hours += entry.timeDecimal;
        acc[entry.client].amount += entry.amount;
        acc[entry.client].entries += 1;
        return acc;
      }, {} as Record<string, any>)
    };

    const summaryContent = JSON.stringify(summary, null, 2);
    const blob = new Blob([summaryContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-summary-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.timeDecimal, 0);
  const totalAmount = timeEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Export Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{timeEntries.length}</div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalHours.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {[...new Set(timeEntries.map(entry => entry.project))].length}
              </div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Table className="w-5 h-5 mr-2" />
              CSV Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Export all time entries in CSV format, compatible with Excel and other spreadsheet applications.
            </p>
            <Button onClick={exportToCSV} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              JSON Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Export raw data in JSON format for integration with other applications or backup purposes.
            </p>
            <Button onClick={exportToJSON} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Summary Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Export a comprehensive summary report with project and client breakdowns.
            </p>
            <Button onClick={exportSummary} variant="secondary" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Summary
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Format Info */}
      <Card>
        <CardHeader>
          <CardTitle>Export Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">CSV Format</h4>
              <p className="text-sm text-muted-foreground">
                Standard comma-separated values format with headers. Compatible with Excel, Google Sheets, and most data analysis tools.
              </p>
            </div>
            <div>
              <h4 className="font-medium">JSON Format</h4>
              <p className="text-sm text-muted-foreground">
                Raw data in JavaScript Object Notation format. Ideal for developers and API integrations.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Summary Report</h4>
              <p className="text-sm text-muted-foreground">
                Comprehensive analytics report including project breakdowns, client summaries, and key metrics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportData;
