import * as React from "react";
import { CalendarIcon, Check } from "lucide-react";
import {
  addDays,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  align?: "start" | "center" | "end";
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
  align = "start",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<
    DateRange | undefined
  >(date);

  const presets = [
    {
      label: "Today",
      value: "today",
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: "Yesterday",
      value: "yesterday",
      dateRange: {
        from: addDays(new Date(), -1),
        to: addDays(new Date(), -1),
      },
    },
    {
      label: "Last 7 days",
      value: "last7",
      dateRange: {
        from: addDays(new Date(), -7),
        to: new Date(),
      },
    },
    {
      label: "Last 30 days",
      value: "last30",
      dateRange: {
        from: addDays(new Date(), -30),
        to: new Date(),
      },
    },
    {
      label: "This week",
      value: "thisWeek",
      dateRange: {
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      },
    },
    {
      label: "This month",
      value: "thisMonth",
      dateRange: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
    },
  ];

  // Handle calendar selection with intermediate state
  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    onDateChange?.(range);

    // Only close if we have both dates
    if (range?.from && range?.to) {
      setIsOpen(false);
    }
  };

  // Update local state when prop changes
  React.useEffect(() => {
    setSelectedRange(date);
  }, [date]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {date?.from ? (
              date.to ? (
                <>
                  <span>{format(date.from, "LLL d, y")} -</span>
                  <span className="ml-1">{format(date.to, "LLL d, y")}</span>
                </>
              ) : (
                format(date.from, "LLL d, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="space-y-4 p-4">
            {/* Preset Selection */}
            <Select
              onValueChange={(value) => {
                const preset = presets.find((p) => p.value === value);
                if (preset) {
                  handleSelect(preset.dateRange);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="rounded-md border">
              <Calendar
                autoFocus
                mode="range"
                defaultMonth={date?.from}
                selected={selectedRange}
                onSelect={handleSelect}
                numberOfMonths={2}
                showOutsideDays={false}
                classNames={{
                  months:
                    "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
                  day_range_start: "day-range-start",
                  day_range_end: "day-range-end",
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>

            {selectedRange && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  {selectedRange.from && (
                    <>
                      <span className="font-medium">Selected: </span>
                      {format(selectedRange.from, "LLL d, y")}
                      {selectedRange.to && (
                        <> - {format(selectedRange.to, "LLL d, y")}</>
                      )}
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    handleSelect(undefined);
                  }}
                  variant="ghost"
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
