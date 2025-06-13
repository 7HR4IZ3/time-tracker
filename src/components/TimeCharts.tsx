
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimeEntry } from '@/types/timeEntry';

interface TimeChartsProps {
  timeEntries: TimeEntry[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347'];

const TimeCharts = ({ timeEntries }: TimeChartsProps) => {
  const chartData = useMemo(() => {
    // Project distribution
    const projectData = timeEntries.reduce((acc, entry) => {
      acc[entry.project] = (acc[entry.project] || 0) + entry.timeDecimal;
      return acc;
    }, {} as Record<string, number>);

    const projectChartData = Object.entries(projectData).map(([project, hours]) => ({
      name: project,
      hours: parseFloat(hours.toFixed(2)),
      amount: timeEntries
        .filter(e => e.project === project)
        .reduce((sum, e) => sum + e.amount, 0)
    }));

    // Daily hours (simulated - you can enhance this with actual dates)
    const dailyData = [
      { day: 'Mon', hours: Math.random() * 8 + 2 },
      { day: 'Tue', hours: Math.random() * 8 + 2 },
      { day: 'Wed', hours: Math.random() * 8 + 2 },
      { day: 'Thu', hours: Math.random() * 8 + 2 },
      { day: 'Fri', hours: Math.random() * 8 + 2 },
    ].map(item => ({ ...item, hours: parseFloat(item.hours.toFixed(2)) }));

    return {
      projectChartData,
      dailyData
    };
  }, [timeEntries]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">{`Hours: ${payload[0].value}`}</p>
          {payload[0].payload.amount && (
            <p className="text-green-600">{`Amount: $${payload[0].payload.amount.toFixed(2)}`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Time Distribution by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.projectChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {chartData.projectChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Work Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Project Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.projectChartData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="hours" fill="#8884d8" name="Hours" radius={[2, 2, 0, 0]} />
              <Bar yAxisId="right" dataKey="amount" fill="#82ca9d" name="Amount ($)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeCharts;
