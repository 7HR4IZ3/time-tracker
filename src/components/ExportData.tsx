
import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeEntry } from '@/types/timeEntry';

interface ExportDataProps {
  timeEntries: TimeEntry[];
}

const ExportData = ({ timeEntries }: ExportDataProps) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const exportToCSV = (data: TimeEntry[]) => {
    const headers = ['Project', 'Client', 'Description', 'Time (h)', 'Time (decimal)', 'Amount (USD)', 'Date', 'Category'];
    const csvContent = [
      headers.join(','),
      ...data.map(entry => [
        `"${entry.project}"`,
        `"${entry.client}"`,
        `"${entry.description}"`,
        `"${entry.timeHours}"`,
        entry.timeDecimal,
        entry.amount,
        entry.date?.toLocaleDateString() || '',
        `"${entry.category || ''}"`
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

  const exportToJSON = (data: TimeEntry[]) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV(timeEntries);
    } else {
      exportToJSON(timeEntries);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center">
                    <Table className="w-4 h-4 mr-2" />
                    CSV File
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    JSON File
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExport} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export {timeEntries.length} entries
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportData;
