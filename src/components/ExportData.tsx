
import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeEntry } from '@/types/timeEntry';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportDataProps {
  timeEntries: TimeEntry[];
}

const ExportData = ({ timeEntries }: ExportDataProps) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

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

  const exportToPDF = (data: TimeEntry[]) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Timesheet Data Export', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Summary
    const totalHours = data.reduce((sum, entry) => sum + entry.timeDecimal, 0);
    const totalAmount = data.reduce((sum, entry) => sum + entry.amount, 0);
    
    doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 20, 50);
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, 60);
    
    // Table data
    const tableData = data.map(entry => [
      entry.project,
      entry.client,
      entry.description.substring(0, 30) + (entry.description.length > 30 ? '...' : ''),
      entry.timeDecimal.toFixed(2),
      `$${entry.amount.toFixed(2)}`
    ]);
    
    // Add table
    (doc as any).autoTable({
      head: [['Project', 'Client', 'Description', 'Hours', 'Amount']],
      body: tableData,
      startY: 80,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
      },
    });
    
    doc.save(`timesheet-export-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV(timeEntries);
    } else if (exportFormat === 'json') {
      exportToJSON(timeEntries);
    } else if (exportFormat === 'pdf') {
      exportToPDF(timeEntries);
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
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'json' | 'pdf') => setExportFormat(value)}>
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
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    PDF Report
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
