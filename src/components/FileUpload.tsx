
import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TimeEntry, TimeRoundingOptions } from '@/types/timeEntry';

interface FileUploadProps {
  onDataImport: (data: TimeEntry[]) => void;
}

const FileUpload = ({ onDataImport }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<number>(75);
  const [roundingInterval, setRoundingInterval] = useState<15 | 30 | 60>(15);

  const roundTime = (timeDecimal: number, interval: 15 | 30 | 60): number => {
    const intervalInHours = interval / 60;
    return Math.ceil(timeDecimal / intervalInHours) * intervalInHours;
  };

  const parseCSV = (csvText: string): TimeEntry[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    const requiredColumns = ['project', 'client', 'description', 'time (h)', 'time (decimal)'];
    const missingColumns = requiredColumns.filter(col => !headers.some(h => h.includes(col.split('(')[0].trim())));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const data: TimeEntry[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < headers.length) continue;
      
      const timeDecimal = parseFloat(values[headers.findIndex(h => h.includes('time (decimal)'))] || '0');
      const roundedTime = roundTime(timeDecimal, roundingInterval);
      
      // Check if amount is provided, if not calculate using hourly rate
      const amountIndex = headers.findIndex(h => h.includes('amount'));
      const providedAmount = amountIndex >= 0 ? parseFloat(values[amountIndex] || '0') : 0;
      const calculatedAmount = providedAmount > 0 ? providedAmount : roundedTime * defaultHourlyRate;
      
      const entry: TimeEntry = {
        id: `entry-${i}`,
        project: values[headers.findIndex(h => h.includes('project'))] || '',
        client: values[headers.findIndex(h => h.includes('client'))] || '',
        description: values[headers.findIndex(h => h.includes('description'))] || '',
        timeHours: values[headers.findIndex(h => h.includes('time (h)'))] || '',
        timeDecimal: roundedTime,
        amount: calculatedAmount,
        date: new Date(),
        category: 'General'
      };
      
      if (entry.project && entry.client && entry.timeDecimal > 0) {
        data.push(entry);
      }
    }
    
    return data;
  };

  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please upload a CSV file');
      }

      const text = await file.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        throw new Error('No valid data found in the CSV file');
      }

      setSuccess(`Successfully imported ${data.length} time entries with ${roundingInterval}-minute rounding`);
      setTimeout(() => {
        onDataImport(data);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, [onDataImport, defaultHourlyRate, roundingInterval]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
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
              value={defaultHourlyRate}
              onChange={(e) => setDefaultHourlyRate(Number(e.target.value))}
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
              onValueChange={(value) => setRoundingInterval(Number(value) as 15 | 30 | 60)}
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

        <div
          className={`relative p-8 rounded-lg border-2 border-dashed transition-all duration-300 text-center ${
            isDragging 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
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
              <h3 className="text-lg font-semibold mb-2">Drop your CSV file here</h3>
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
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Expected CSV Format:</h4>
          <p className="text-sm text-muted-foreground">
            Project, Client, Description, Time (h), Time (decimal), Amount (USD) [optional]
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            * Amount column is optional - will be calculated using hourly rate if empty
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
