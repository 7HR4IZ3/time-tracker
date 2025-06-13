import { TimeEntry } from "@/types/timeEntry";

export const parseCSVRow = (row: any): TimeEntry => {
  const startDate = new Date(row["Start Date"]);

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
    timeDecimal: Number(row["Duration (decimal)"]) || 0,
    billableRate: Number(row["Billable Rate (USD)"]) || 0,
    billableAmount: Number(row["Billable Amount (USD)"]) || 0,
    amount: 0, // Will be calculated later based on hourly rate
    date: startDate, // Using startDate as the primary date
  };
};

export const parseCSVData = (csvData: any[]): TimeEntry[] => {
  return csvData
    .filter(
      (row) =>
        row["Duration (decimal)"] && Number(row["Duration (decimal)"]) > 0
    )
    .map(parseCSVRow);
};
