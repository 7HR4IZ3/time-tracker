
import { useState } from 'react';
import { Clock, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeEntry, TimeRoundingOptions } from '@/types/timeEntry';

interface TimeRoundingProps {
  timeEntries: TimeEntry[];
  onEntriesUpdate: (entries: TimeEntry[]) => void;
}

const TimeRounding = ({ timeEntries, onEntriesUpdate }: TimeRoundingProps) => {
  const [roundingInterval, setRoundingInterval] = useState<15 | 30 | 60>(15);
  const [hourlyRate, setHourlyRate] = useState<number>(75);

  const roundTime = (timeDecimal: number, interval: 15 | 30 | 60): number => {
    const intervalInHours = interval / 60;
    return Math.ceil(timeDecimal / intervalInHours) * intervalInHours;
  };

  const applyTimeRounding = () => {
    const updatedEntries = timeEntries.map(entry => ({
      ...entry,
      timeDecimal: roundTime(entry.timeDecimal, roundingInterval),
      amount: roundTime(entry.timeDecimal, roundingInterval) * hourlyRate
    }));
    
    onEntriesUpdate(updatedEntries);
  };

  const recalculateAmounts = () => {
    const updatedEntries = timeEntries.map(entry => ({
      ...entry,
      amount: entry.timeDecimal * hourlyRate
    }));
    
    onEntriesUpdate(updatedEntries);
  };

  const totalOriginalHours = timeEntries.reduce((sum, entry) => sum + entry.timeDecimal, 0);
  const totalRoundedHours = timeEntries.reduce((sum, entry) => sum + roundTime(entry.timeDecimal, roundingInterval), 0);
  const timeDifference = totalRoundedHours - totalOriginalHours;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Time Adjustments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roundingSelect">Time Rounding Interval</Label>
              <Select 
                value={roundingInterval.toString()} 
                onValueChange={(value) => setRoundingInterval(Number(value) as 15 | 30 | 60)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hourlyRateInput">Hourly Rate ($)</Label>
              <Input
                id="hourlyRateInput"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Total</p>
              <p className="text-lg font-semibold">{totalOriginalHours.toFixed(2)}h</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">After Rounding</p>
              <p className="text-lg font-semibold">{totalRoundedHours.toFixed(2)}h</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Difference</p>
              <p className={`text-lg font-semibold ${timeDifference > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                +{timeDifference.toFixed(2)}h
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyTimeRounding} className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              Apply Rounding
            </Button>
            <Button onClick={recalculateAmounts} variant="outline" className="flex-1">
              <Calculator className="w-4 h-4 mr-2" />
              Recalculate Amounts
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeRounding;
