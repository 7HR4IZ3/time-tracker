
import { useState, useMemo } from 'react';
import { FileText, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { TimeEntry } from '@/types/timeEntry';

interface InvoiceGeneratorProps {
  timeEntries: TimeEntry[];
}

const InvoiceGenerator = ({ timeEntries }: InvoiceGeneratorProps) => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number>(75);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-001');

  const clients = useMemo(() => {
    return [...new Set(timeEntries.map(entry => entry.client))].sort();
  }, [timeEntries]);

  const clientEntries = useMemo(() => {
    if (!selectedClient) return [];
    return timeEntries.filter(entry => entry.client === selectedClient);
  }, [timeEntries, selectedClient]);

  const invoiceData = useMemo(() => {
    const projects = clientEntries.reduce((acc, entry) => {
      if (!acc[entry.project]) {
        acc[entry.project] = {
          project: entry.project,
          entries: [],
          totalHours: 0,
          totalAmount: 0
        };
      }
      acc[entry.project].entries.push(entry);
      acc[entry.project].totalHours += entry.timeDecimal;
      acc[entry.project].totalAmount += entry.timeDecimal * hourlyRate;
      return acc;
    }, {} as Record<string, any>);

    const projectSummaries = Object.values(projects);
    const totalHours = projectSummaries.reduce((sum, p) => sum + p.totalHours, 0);
    const totalAmount = projectSummaries.reduce((sum, p) => sum + p.totalAmount, 0);

    return {
      projectSummaries,
      totalHours,
      totalAmount
    };
  }, [clientEntries, hourlyRate]);

  const generateInvoicePDF = () => {
    // In a real app, you'd use a PDF library like jsPDF or react-pdf
    const invoiceContent = `
INVOICE

Invoice #: ${invoiceNumber}
Date: ${new Date().toLocaleDateString()}
Client: ${selectedClient}

---

${invoiceData.projectSummaries.map(project => `
Project: ${project.project}
Hours: ${project.totalHours.toFixed(2)}
Rate: $${hourlyRate}/hour
Amount: $${project.totalAmount.toFixed(2)}
`).join('\n')}

---

Total Hours: ${invoiceData.totalHours.toFixed(2)}
Total Amount: $${invoiceData.totalAmount.toFixed(2)}
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoiceNumber}-${selectedClient}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Invoice Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Invoice Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Hourly Rate ($)</label>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Invoice Number</label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      {selectedClient && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Preview</CardTitle>
            <Button onClick={generateInvoicePDF} className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold">INVOICE</h2>
                <p className="text-muted-foreground">#{invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>

              <Separator />

              {/* Client Info */}
              <div>
                <h3 className="font-semibold text-lg">Bill To:</h3>
                <p className="text-lg">{selectedClient}</p>
              </div>

              <Separator />

              {/* Project Breakdown */}
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceData.projectSummaries.map((project, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{project.project}</TableCell>
                        <TableCell className="text-right">{project.totalHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${hourlyRate}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${project.totalAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-end">
                <div className="text-right space-y-2">
                  <div className="flex justify-between items-center min-w-[200px]">
                    <span>Total Hours:</span>
                    <span className="font-semibold">{invoiceData.totalHours.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">${invoiceData.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoiceGenerator;
