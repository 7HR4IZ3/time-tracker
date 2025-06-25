import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import Dashboard from "@/components/Dashboard";
import { FilterOptions, TimeEntry } from "@/types/timeEntry";
import { parseFilterParams } from "@/utils/urlParams";
import { SnapshotService } from "@/services/snapshotService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [hasData, setHasData] = useState(false);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [defaultRate, setDefaultRate] = useState<number>(25);
  const [defaultInterval, setDefaultInterval] = useState<15 | 30 | 60>(60);
  const [initialFilters, setInitialFilters] = useState<FilterOptions>({});
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    const rate = params.get("rate");
    const interval = params.get("interval");
    const snapshotId = params.get("snapshot");
    const filters = parseFilterParams(params);

    // Handle snapshot loading first
    if (snapshotId) {
      loadSnapshot(snapshotId);
      return;
    }

    // Otherwise handle normal URL parameters
    if (url) setInitialUrl(url);
    if (rate) setDefaultRate(Number(rate));
    if (interval) setDefaultInterval(Number(interval) as 15 | 30 | 60);
    setInitialFilters(filters);
  }, []);

  const loadSnapshot = async (snapshotId: string) => {
    setIsLoadingSnapshot(true);
    try {
      const snapshot = await SnapshotService.loadSnapshot(snapshotId);
      
      // Load all snapshot data
      setTimeEntries(snapshot.timeEntries);
      setDefaultRate(snapshot.defaultHourlyRate);
      setDefaultInterval(snapshot.defaultRoundingInterval);
      setInitialFilters(snapshot.currentFilters || {});
      setHasData(true);

      toast({
        title: "Snapshot loaded!",
        description: snapshot.title || "Timesheet snapshot loaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error loading snapshot",
        description: "Failed to load the shared snapshot. Please check the link and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  const handleDataImport = (data: TimeEntry[]) => {
    setTimeEntries(data);
    setHasData(true);
    setInitialUrl(null); // Clear the initial URL after successful import
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      {isLoadingSnapshot ? (
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading snapshot...</p>
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-6 shadow-lg">
                <Upload className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
                TimeTracker Analytics
              </h1>
              <p className="text-xl text-muted-foreground">
                Upload your timesheet data to get started with powerful
                analytics and insights
              </p>
            </div>
            <FileUpload
              onDataImport={handleDataImport}
              initialUrl={initialUrl}
              defaultHourlyRate={defaultRate}
              defaultRoundingInterval={defaultInterval}
            />
          </div>
        </div>
      ) : (
        <Dashboard
          timeEntries={timeEntries}
          onNewData={() => setHasData(false)}
          defaultHourlyRate={defaultRate}
          defaultRoundingInterval={defaultInterval}
          initialFilters={initialFilters}
        />
      )}
    </div>
  );
};

export default Index;
