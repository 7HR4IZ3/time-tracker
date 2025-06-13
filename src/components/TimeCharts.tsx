import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { TimeEntry } from "@/types/timeEntry";

interface TimeChartsProps {
  timeEntries: TimeEntry[];
}

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#8dd1e1",
  "#d084d0",
  "#ffb347",
];

const TimeCharts = ({ timeEntries }: TimeChartsProps) => {
  const chartData = useMemo(() => {
    // Project distribution
    const projectData = timeEntries.reduce((acc, entry) => {
      acc[entry.project] = (acc[entry.project] || 0) + entry.timeDecimal;
      return acc;
    }, {} as Record<string, number>);

    // Daily trend data
    const dailyData = timeEntries.reduce((acc, entry) => {
      const date = new Date(entry.startDate).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          hours: 0,
          amount: 0,
          entries: 0,
        };
      }
      acc[date].hours += entry.timeDecimal;
      acc[date].amount += entry.amount;
      acc[date].entries += 1;
      return acc;
    }, {} as Record<string, any>);

    return {
      projectChartData: Object.entries(projectData)
        .map(([project, hours]) => ({
          name: project,
          hours: parseFloat(hours.toFixed(2)),
          amount: timeEntries
            .filter((e) => e.project === project)
            .reduce((sum, e) => sum + e.amount, 0),
        }))
        .sort((a, b) => b.hours - a.hours),

      dailyTrendData: Object.values(dailyData)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((day) => ({
          ...day,
          hours: parseFloat(day.hours.toFixed(2)),
          amount: parseFloat(day.amount.toFixed(2)),
        })),
    };
  }, [timeEntries]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">{`Hours: ${payload[0].value}`}</p>
          {payload[0].payload.amount && (
            <p className="text-green-600">{`Amount: $${payload[0].payload.amount.toFixed(
              2
            )}`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Time Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Time & Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.dailyTrendData}>
                <defs>
                  <linearGradient id="hours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="amount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis yAxisId="hours" />
                <YAxis yAxisId="amount" orientation="right" />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="hours"
                  type="monotone"
                  dataKey="hours"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#hours)"
                  name="Hours"
                />
                <Area
                  yAxisId="amount"
                  type="monotone"
                  dataKey="amount"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#amount)"
                  name="Amount ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Distribution by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.projectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="hours"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {chartData.projectChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.projectChartData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="hours" />
                  <YAxis yAxisId="amount" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="hours"
                    dataKey="hours"
                    fill="#8884d8"
                    name="Hours"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="amount"
                    dataKey="amount"
                    fill="#82ca9d"
                    name="Amount ($)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
};

export default TimeCharts;
