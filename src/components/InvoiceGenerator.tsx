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
import { applyPlugin } from "jspdf-autotable";
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
  const [payToDetails, setPayToDetails] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    bankName: "Lead Bank",
    bankAddress: "9450 Southwest Gemini Drive, Beaverton, OR, 97008, USA",
    accountName: "",
    accountNumber: "214996969449",
    swiftCode: "",
    routingNumber: "101019644",
    accountType: "Personal Checking"
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
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    // Simple invoice title and details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("INVOICE", 20, yPos);
    
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - 20, yPos, { align: "right" });
    doc.text(`Date: ${new Date(invoiceDate).toLocaleDateString()}`, pageWidth - 20, yPos + 7, { align: "right" });
    doc.text(`Due: ${new Date(dueDate).toLocaleDateString()}`, pageWidth - 20, yPos + 14, { align: "right" });

    yPos += 30;

    // Total section at the top
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(`Total Hours: ${invoiceData.totalHours.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
    doc.text(`Total Amount: $${invoiceData.totalAmount.toFixed(2)}`, pageWidth - 20, yPos + 10, { align: "right" });

    yPos += 30;

    // Pay To and Bill To sections (side by side)
    const leftColumnX = 20;
    const rightColumnX = pageWidth / 2 + 10;

    // Pay To section
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Pay To:", leftColumnX, yPos);
    
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    let payToYPos = yPos + 10;

    // Contact info
    const payToContactLines = [
      payToDetails.name,
      payToDetails.address,
      payToDetails.email,
      payToDetails.phone,
    ].filter(Boolean);

    payToContactLines.forEach((line) => {
      if (line) {
        doc.text(line, leftColumnX, payToYPos);
        payToYPos += 5;
      }
    });

    // Banking info
    const bankingLines = [
      payToDetails.bankName && `Bank: ${payToDetails.bankName}`,
      payToDetails.bankAddress && `Bank Address: ${payToDetails.bankAddress}`,
      payToDetails.accountName && `Account Name: ${payToDetails.accountName}`,
      payToDetails.accountNumber && `Account #: ${payToDetails.accountNumber}`,
      payToDetails.swiftCode && `SWIFT: ${payToDetails.swiftCode}`,
      payToDetails.routingNumber && `Routing: ${payToDetails.routingNumber}`,
    ].filter(Boolean);

    if (bankingLines.length > 0) {
      payToYPos += 5;
      bankingLines.forEach((line) => {
        if (line) {
          doc.text(line, leftColumnX, payToYPos);
          payToYPos += 5;
        }
      });
    }

    // Bill To section
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Bill To:", rightColumnX, yPos);
    
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(selectedClient, rightColumnX, yPos + 10);

    // Company info at bottom of sections
    if (companyDetails.name || companyDetails.address || companyDetails.email || companyDetails.phone) {
      const companyYPos = Math.max(payToYPos, yPos + 30) + 10;
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.text("From:", leftColumnX, companyYPos);
      if (companyDetails.name) doc.text(companyDetails.name, leftColumnX, companyYPos + 5);
      if (companyDetails.address) doc.text(companyDetails.address, leftColumnX, companyYPos + 10);
      if (companyDetails.email || companyDetails.phone) {
        doc.text(`${companyDetails.email} ${companyDetails.phone}`, leftColumnX, companyYPos + 15);
      }
      yPos = companyYPos + 25;
    } else {
      yPos = Math.max(payToYPos, yPos + 40) + 10;
    }

    // Project summaries
    invoiceData.projectSummaries.forEach((project) => {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text(project.project, 20, yPos);
      yPos += 10;

      // @ts-ignore
      doc.autoTable({
        head: [["Date", "Description", "Hours", "Rate", "Amount"]],
        body: project.entries.map((entry) => [
          new Date(entry.startDate).toLocaleDateString(),
          entry.description.substring(0, 40),
          entry.timeDecimal.toFixed(2),
          `$${hourlyRate}`,
          `$${(entry.timeDecimal * hourlyRate).toFixed(2)}`,
        ]),
        startY: yPos,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 220, 220] },
      });

      // @ts-ignore
      yPos = doc.lastAutoTable.finalY + 15;
    });

    // Simple footer
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 20, { align: "center" });

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
        description: `Invoice snapshot for ${selectedClient} with ${invoiceData.totalHours.toFixed(
          2
        )} hours`,
        activeView: "invoice",
        invoiceState: {
          selectedClient,
          hourlyRate,
          invoiceNumber,
          companyDetails,
          payToDetails,
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

            {/* Pay To Details */}
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Payment Recipient
              </h3>
              <div className="space-y-6">
                {/* Personal/Business Details */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={payToDetails.name}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Payment Recipient Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={payToDetails.address}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        placeholder="123 Payment St, City, State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={payToDetails.email}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="payment@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={payToDetails.phone}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Banking Details */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-3">Banking Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={payToDetails.bankName}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            bankName: e.target.value,
                          }))
                        }
                        placeholder="Bank of America"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Address</Label>
                      <Input
                        value={payToDetails.bankAddress}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            bankAddress: e.target.value,
                          }))
                        }
                        placeholder="123 Bank St, City, State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input
                        value={payToDetails.accountName}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            accountName: e.target.value,
                          }))
                        }
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        value={payToDetails.accountNumber}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            accountNumber: e.target.value,
                          }))
                        }
                        placeholder="1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <Input
                        value={payToDetails.accountType}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            accountType: e.target.value,
                          }))
                        }
                        placeholder="Personal Checking"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SWIFT Code</Label>
                      <Input
                        value={payToDetails.swiftCode}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            swiftCode: e.target.value,
                          }))
                        }
                        placeholder="BOFAUS3N"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Routing Number</Label>
                      <Input
                        value={payToDetails.routingNumber}
                        onChange={(e) =>
                          setPayToDetails((prev) => ({
                            ...prev,
                            routingNumber: e.target.value,
                          }))
                        }
                        placeholder="021000322"
                      />
                    </div>
                  </div>
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

              {/* Pay To and Bill To sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg">Pay To:</h3>
                  <div className="text-sm space-y-1 mt-2">
                    {payToDetails.name && <p>{payToDetails.name}</p>}
                    {payToDetails.address && <p>{payToDetails.address}</p>}
                    {payToDetails.email && <p>{payToDetails.email}</p>}
                    {payToDetails.phone && <p>{payToDetails.phone}</p>}
                    {payToDetails.bankName && <p className="mt-3 font-medium">Banking Details:</p>}
                    {payToDetails.bankName && <p>Bank: {payToDetails.bankName}</p>}
                    {payToDetails.bankAddress && <p>Bank Address: {payToDetails.bankAddress}</p>}
                    {payToDetails.accountName && <p>Account Name: {payToDetails.accountName}</p>}
                    {payToDetails.accountNumber && <p>Account #: {payToDetails.accountNumber}</p>}
                    {payToDetails.swiftCode && <p>SWIFT: {payToDetails.swiftCode}</p>}
                    {payToDetails.routingNumber && <p>Routing #: {payToDetails.routingNumber}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Bill To:</h3>
                  <p className="text-lg mt-2">{selectedClient}</p>
                </div>
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
