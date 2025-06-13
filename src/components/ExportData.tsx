import { useState } from "react";
import { Download, FileText, Table, Check, Sheet } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimeEntry } from "@/types/timeEntry";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface ExportDataProps {
  timeEntries: TimeEntry[];
}

const ExportData = ({ timeEntries }: ExportDataProps) => {
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "json" | "pdf">(
    "pdf"
  );
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data: TimeEntry[]) => {
    const headers = [
      "Project",
      "Client",
      "Description",
      "Time (h)",
      "Time (decimal)",
      "Amount (USD)",
      "Date",
      "Category",
    ];
    const csvContent = [
      headers.join(","),
      ...data.map((entry) =>
        [
          `"${entry.project}"`,
          `"${entry.client}"`,
          `"${entry.description}"`,
          `"${entry.timeHours}"`,
          entry.timeDecimal,
          entry.amount,
          entry.date?.toLocaleDateString() || "",
          `"${entry.tags || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = (data: TimeEntry[]) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet-export-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (data: TimeEntry[]) => {
    const doc = new jsPDF();

    // Add company logo/branding
    doc.setFillColor(52, 52, 52);
    doc.rect(0, 0, 210, 40, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Time Tracking Report", 20, 25);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Summary section
    doc.setFontSize(12);
    const totalHours = data.reduce((sum, entry) => sum + entry.timeDecimal, 0);
    const totalAmount = data.reduce((sum, entry) => sum + entry.amount, 0);
    const uniqueProjects = new Set(data.map((entry) => entry.project)).size;
    const uniqueClients = new Set(data.map((entry) => entry.client)).size;

    doc.text("Summary", 20, 50);
    doc.setFontSize(10);
    doc.text(
      [
        `Total Entries: ${data.length}`,
        `Total Hours: ${totalHours.toFixed(2)}`,
        `Total Amount: $${totalAmount.toFixed(2)}`,
        `Projects: ${uniqueProjects}`,
        `Clients: ${uniqueClients}`,
      ],
      20,
      60
    );

    // Group entries by project
    const projectGroups = data.reduce((groups, entry) => {
      if (!groups[entry.project]) {
        groups[entry.project] = [];
      }
      groups[entry.project].push(entry);
      return groups;
    }, {} as Record<string, TimeEntry[]>);

    let currentY = 90;

    Object.entries(projectGroups).forEach(([project, entries]) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Project header
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(project, 20, currentY);
      currentY += 10;

      // Project entries table
      (doc as any).autoTable({
        head: [["Date", "Description", "Hours", "Amount"]],
        body: entries.map((entry) => [
          new Date(entry.startDate).toLocaleDateString(),
          entry.description.substring(0, 40),
          entry.timeDecimal.toFixed(2),
          `$${entry.amount.toFixed(2)}`,
        ]),
        startY: currentY,
        margin: { left: 20 },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [80, 80, 80] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`timesheet-export-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedFormat === "csv") {
        exportToCSV(timeEntries);
      } else if (selectedFormat === "json") {
        exportToJSON(timeEntries);
      } else if (selectedFormat === "pdf") {
        exportToPDF(timeEntries);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Time Entries
          </CardTitle>
          <CardDescription>
            Export your time entries in various formats for reporting and
            analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={selectedFormat === "pdf" ? "default" : "outline"}
                className="flex flex-col items-center p-6 h-auto gap-2"
                onClick={() => setSelectedFormat("pdf")}
              >
                <FileText className="w-8 h-8" />
                <span>PDF Report</span>
                <span className="text-xs text-muted-foreground">
                  Detailed report with summaries
                </span>
              </Button>

              <Button
                variant={selectedFormat === "csv" ? "default" : "outline"}
                className="flex flex-col items-center p-6 h-auto gap-2"
                onClick={() => setSelectedFormat("csv")}
              >
                <Sheet className="w-8 h-8" />
                <span>CSV File</span>
                <span className="text-xs text-muted-foreground">
                  Excel/Spreadsheet compatible
                </span>
              </Button>

              <Button
                variant={selectedFormat === "json" ? "default" : "outline"}
                className="flex flex-col items-center p-6 h-auto gap-2"
                onClick={() => setSelectedFormat("json")}
              >
                <Table className="w-8 h-8" />
                <span>JSON Data</span>
                <span className="text-xs text-muted-foreground">
                  Raw data format
                </span>
              </Button>
            </div>

            {/* Export Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Export Summary</h3>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{timeEntries.length} entries</Badge>
                <Badge variant="secondary">
                  {new Set(timeEntries.map((e) => e.project)).size} projects
                </Badge>
                <Badge variant="secondary">
                  {new Set(timeEntries.map((e) => e.client)).size} clients
                </Badge>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              className="w-full"
              disabled={isExporting}
            >
              {isExporting ? (
                <>Processing...</>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export as {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportData;
