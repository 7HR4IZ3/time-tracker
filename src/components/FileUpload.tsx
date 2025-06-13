import { useState, useCallback, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TimeEntry, TimeRoundingOptions } from "@/types/timeEntry";
import Papa from "papaparse";

interface FileUploadProps {
  onDataImport: (data: TimeEntry[]) => void;
  initialUrl?: string | null;
  defaultHourlyRate?: number;
  defaultRoundingInterval?: 15 | 30 | 60;
}

const FileUpload = ({
  onDataImport,
  initialUrl,
  defaultHourlyRate = 25,
  defaultRoundingInterval = 60,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(defaultHourlyRate);
  const [roundingInterval, setRoundingInterval] = useState<15 | 30 | 60>(
    defaultRoundingInterval
  );
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      handleUrlSubmit();
    }
  }, [initialUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const roundTime = (timeDecimal: number, interval: 15 | 30 | 60): number => {
    const intervalInHours = interval / 60;
    return Math.ceil(timeDecimal / intervalInHours) * intervalInHours;
  };

  const parseCSVData = useCallback(
    (results: any) => {
      const rows = results.data.filter(
        (row: any) =>
          row["Duration (decimal)"] && Number(row["Duration (decimal)"]) > 0
      );

      return rows.map((row: any) => {
        const startDate = new Date(row["Start Date"]);
        const timeDecimal = Number(row["Duration (decimal)"]) || 0;
        const roundedTime = roundTime(timeDecimal, roundingInterval);

        return {
          id: `${row["Project"]}-${startDate.getTime()}-${row["Start Time"]}`,
          project: row["Project"] || "",
          client: row["Client"] || "",
          description: row["Description"] || "",
          task: row["Task"] || "",
          user: row["User"] || "",
          group: row["Group"] || "",
          email: row["Email"] || "",
          tags: row["Tags"] || "",
          billable: row["Billable"]?.toLowerCase() === "yes",
          startDate: startDate,
          startTime: row["Start Time"] || "",
          endDate: new Date(row["End Date"]),
          endTime: row["End Time"] || "",
          timeHours: row["Duration (h)"] || "0:00:00",
          timeDecimal: roundedTime,
          billableRate: Number(row["Billable Rate (USD)"]) || 0,
          billableAmount: Number(row["Billable Amount (USD)"]) || 0,
          amount: roundedTime * hourlyRate,
          date: startDate,
        };
      });
    },
    [hourlyRate, roundingInterval]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      try {
        if (!file.name.toLowerCase().endsWith(".csv")) {
          throw new Error("Please upload a CSV file");
        }

        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              // Validate required columns
              const requiredColumns = [
                "Project",
                "Client",
                "Description",
                "Start Date",
                "Start Time",
                "End Date",
                "End Time",
                "Duration (h)",
                "Duration (decimal)",
              ];

              const missingColumns = requiredColumns.filter(
                (col) => !results.meta.fields?.includes(col)
              );

              if (missingColumns.length > 0) {
                throw new Error(
                  `Missing required columns: ${missingColumns.join(", ")}`
                );
              }

              const entries = parseCSVData(results);

              if (entries.length === 0) {
                throw new Error("No valid time entries found in the CSV file");
              }

              setSuccess(
                `Successfully imported ${entries.length} time entries`
              );
              setTimeout(() => onDataImport(entries), 1000);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to process data"
              );
            } finally {
              setIsProcessing(false);
            }
          },
          error: (error) => {
            setError(`Failed to parse CSV: ${error.message}`);
            setIsProcessing(false);
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file");
        setIsProcessing(false);
      }
    },
    [parseCSVData, onDataImport]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(url);
      const text = await response.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const requiredColumns = [
              "Project",
              "Client",
              "Description",
              "Start Date",
              "Start Time",
              "End Date",
              "End Time",
              "Duration (h)",
              "Duration (decimal)",
            ];

            const missingColumns = requiredColumns.filter(
              (col) => !results.meta.fields?.includes(col)
            );

            if (missingColumns.length > 0) {
              throw new Error(
                `Missing required columns: ${missingColumns.join(", ")}`
              );
            }

            const entries = parseCSVData(results);

            if (entries.length === 0) {
              throw new Error("No valid time entries found in the CSV file");
            }

            setSuccess(`Successfully imported ${entries.length} time entries`);
            setTimeout(() => onDataImport(entries), 1000);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Failed to process data"
            );
          } finally {
            setLoading(false);
          }
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`);
          setLoading(false);
        },
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch data from URL"
      );
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-center">Import Timesheet Data</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Configuration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="hourlyRate">Default Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              min="0"
              step="0.01"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used when amount column is empty
            </p>
          </div>

          <div>
            <Label htmlFor="rounding">Time Rounding</Label>
            <Select
              value={roundingInterval.toString()}
              onValueChange={(value) =>
                setRoundingInterval(Number(value) as 15 | 30 | 60)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Round up time entries to nearest interval
            </p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-4 mb-6">
          <div className="grid w-full items-center gap-4">
            <Input
              type="url"
              placeholder="Enter CSV URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              onClick={handleUrlSubmit}
              disabled={loading || !url}
              className="w-full"
            >
              {loading ? "Loading..." : "Load from URL"}
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
        </div>

        <div
          className={`relative p-8 rounded-lg border-2 border-dashed transition-all duration-300 text-center ${
            isDragging
              ? "border-primary bg-primary/5 scale-105"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Processing your file...</p>
            </div>
          ) : (
            <>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-muted-foreground mb-4">
                or click to browse your files
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="pointer-events-none">
                Choose File
              </Button>
            </>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-3">
          <h4 className="font-medium">Required CSV Columns:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <strong>Basic Information:</strong>
              <ul className="list-disc list-inside ml-2">
                <li>Project</li>
                <li>Client</li>
                <li>Description</li>
                <li>Task (optional)</li>
              </ul>
            </div>
            <div>
              <strong>Time Information:</strong>
              <ul className="list-disc list-inside ml-2">
                <li>Start Date</li>
                <li>Start Time</li>
                <li>End Date</li>
                <li>End Time</li>
                <li>Duration (h)</li>
                <li>Duration (decimal)</li>
              </ul>
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              * Optional columns: Task, Tags, Group, User, Email, Billable Rate
              (USD), Billable Amount (USD)
            </p>
            <p>
              * Amount will be calculated using the hourly rate if not provided
            </p>
            <p>* Dates should be in YYYY-MM-DD format</p>
            <p>* Times should be in HH:mm:ss format</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
