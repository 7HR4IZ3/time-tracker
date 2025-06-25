import { useState, useMemo, useEffect } from "react";
import { FileText, Download, Plus, Building, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { TimeEntry } from "@/types/timeEntry";
import jsPDF from "jspdf";
import { applyPlugin } from 'jspdf-autotable'
import { addDays, format } from "date-fns";
import { ShareButton } from "./ShareButton";
import { SnapshotService } from "@/services/snapshotService";

interface InvoiceGeneratorProps {
  timeEntries: TimeEntry[];
}

applyPlugin(jsPDF);

const InvoiceGenerator = ({ timeEntries }: InvoiceGeneratorProps) => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [hourlyRate, setHourlyRate] = useState<number>(75);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("INV-001");
  const [companyDetails, setCompanyDetails] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
  });
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });

  useEffect(() => {
    if (dateRange.from) {
      setInvoiceDate(format(dateRange.from, "yyyy-MM-dd"));
    }
    if (dateRange.to) {
      setDueDate(format(dateRange.to, "yyyy-MM-dd"));
    }
  }, [dateRange]);

  const clients = useMemo(() => {
    return [...new Set(timeEntries.map((entry) => entry.client))].sort();
  }, [timeEntries]);

  const clientEntries = useMemo(() => {
    if (!selectedClient) return [];
    return timeEntries.filter((entry) => entry.client === selectedClient);
  }, [timeEntries, selectedClient]);

  const invoiceData = useMemo(() => {
    const projects = clientEntries.reduce((acc, entry) => {
      if (!acc[entry.project]) {
        acc[entry.project] = {
          project: entry.project,
          entries: [],
          totalHours: 0,
          totalAmount: 0,
        };
      }
      acc[entry.project].entries.push(entry);
      acc[entry.project].totalHours += entry.timeDecimal;
      acc[entry.project].totalAmount += entry.timeDecimal * hourlyRate;
      return acc;
    }, {} as Record<string, any>);

    const projectSummaries = Object.values(projects);
    const totalHours = projectSummaries.reduce(
      (sum, p) => sum + p.totalHours,
      0
    );
    const totalAmount = projectSummaries.reduce(
      (sum, p) => sum + p.totalAmount,
      0
    );

    return {
      projectSummaries,
      totalHours,
      totalAmount,
    };
  }, [clientEntries, hourlyRate]);

  const generateInvoicePDF = () => {
    const doc = new jsPDF();

    // Header with branding
    doc.setFillColor(52, 52, 52);
    doc.rect(0, 0, 210, 60, "F");

    // Company info (white text on dark background)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(companyDetails.name || "Invoice", 20, 30);

    doc.setFontSize(10);
    if (companyDetails.address) {
      doc.text(companyDetails.address, 20, 40);
    }
    if (companyDetails.email || companyDetails.phone) {
      doc.text(`${companyDetails.email} | ${companyDetails.phone}`, 20, 50);
    }

    // Reset text color for rest of document
    doc.setTextColor(0, 0, 0);

    // Invoice details
    doc.setFontSize(12);
    doc.text(
      [
        `Invoice #: ${invoiceNumber}`,
        `Date: ${new Date(invoiceDate).toLocaleDateString()}`,
        `Due Date: ${new Date(dueDate).toLocaleDateString()}`,
      ],
      20,
      80
    );

    // Client info
    doc.setFontSize(14);
    doc.text("Bill To:", 20, 110);
    doc.setFontSize(12);
    doc.text(selectedClient, 20, 120);

    // Project summaries
    let yPos = 140;
    invoiceData.projectSummaries.forEach((project) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(project.project, 20, yPos);
      yPos += 10;

      // Project entries table
      // @ts-ignore
      doc.autoTable({
        head: [["Date", "Description", "Hours", "Rate", "Amount"]],
        body: project.entries.map((entry) => [
          new Date(entry.startDate).toLocaleDateString(),
          entry.description.substring(0, 30),
          entry.timeDecimal.toFixed(2),
          `$${hourlyRate}`,
          `$${(entry.timeDecimal * hourlyRate).toFixed(2)}`,
        ]),
        startY: yPos,
        margin: { left: 20 },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [80, 80, 80] },
      });

      // @ts-ignore
      yPos = doc.lastAutoTable.finalY + 15;
    });
    // Total section
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(
      [
        `Total Hours: ${invoiceData.totalHours.toFixed(2)}`,
        `Total Amount: $${invoiceData.totalAmount.toFixed(2)}`,
      ],
      120,
      yPos + 10
    );

    // Footer
    const footerText = "Thank you for your business!";
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(footerText, 105, 280, { align: "center" });

    doc.save(`invoice-${invoiceNumber}-${selectedClient}.pdf`);
  };

  const getCurrentInvoiceSnapshot = () => {
    return SnapshotService.createSnapshot(
      timeEntries,
      {
        defaultHourlyRate: hourlyRate,
        defaultRoundingInterval: 60, // Default for invoices
        currentFilters: {}, // No filters for invoice view
      },
      {
        title: `Invoice ${invoiceNumber} - ${selectedClient}`,
        description: `Invoice snapshot for ${selectedClient} with ${invoiceData.totalHours.toFixed(2)} hours`,
        activeView: 'invoice',
        invoiceState: {
          selectedClient,
          hourlyRate,
          invoiceNumber,
          companyDetails,
        },
      }
    );
  };

  const generateInvoiceText = () => {
    const invoiceContent = `
INVOICE

Invoice #: ${invoiceNumber}
Date: ${new Date(invoiceDate).toLocaleDateString()}
Due Date: ${new Date(dueDate).toLocaleDateString()}
Client: ${selectedClient}

---

${invoiceData.projectSummaries
  .map(
    (project) => `
Project: ${project.project}
Hours: ${project.totalHours.toFixed(2)}
Rate: $${hourlyRate}/hour
Amount: $${project.totalAmount.toFixed(2)}
`
  )
  .join("\n")}

---

Total Hours: ${invoiceData.totalHours.toFixed(2)}
Total Amount: $${invoiceData.totalAmount.toFixed(2)}
    `;

    const blob = new Blob([invoiceContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoiceNumber}-${selectedClient}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice Generator
          </CardTitle>
          <CardDescription>
            Generate professional invoices from your time entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Company Details */}
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={companyDetails.name}
                    onChange={(e) =>
                      setCompanyDetails((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Address</Label>
                  <Input
                    value={companyDetails.address}
                    onChange={(e) =>
                      setCompanyDetails((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="123 Business St, City, State"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={companyDetails.email}
                    onChange={(e) =>
                      setCompanyDetails((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={companyDetails.phone}
                    onChange={(e) =>
                      setCompanyDetails((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Invoice Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select
                    value={selectedClient}
                    onValueChange={setSelectedClient}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client} value={client}>
                          {client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hourly Rate ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="pl-9"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="col-span-3 space-y-2">
                  <Label>Invoice Period</Label>
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={(range) => {
                      if (range) setDateRange(range);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      {selectedClient && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Invoice Preview</CardTitle>
              <CardDescription>
                Preview and download your invoice
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateInvoicePDF}
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={generateInvoiceText}
                variant="outline"
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Text
              </Button>
              <ShareButton 
                snapshot={getCurrentInvoiceSnapshot()} 
                variant="outline" 
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold">INVOICE</h2>
                <p className="text-muted-foreground">#{invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(invoiceDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Due: {new Date(dueDate).toLocaleDateString()}
                </p>
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
                        <TableCell className="font-medium">
                          {project.project}
                        </TableCell>
                        <TableCell className="text-right">
                          {project.totalHours.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${hourlyRate}
                        </TableCell>
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
                    <span className="font-semibold">
                      {invoiceData.totalHours.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">
                      ${invoiceData.totalAmount.toFixed(2)}
                    </span>
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
