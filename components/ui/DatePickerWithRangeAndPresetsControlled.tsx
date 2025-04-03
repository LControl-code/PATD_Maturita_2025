'use client';

import * as React from 'react';
import { addDays, format, subDays, subMonths } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DatePickerWithRangeAndPresetsProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange | undefined;
  setDate?: (date: DateRange | undefined) => void;
}

export function DatePickerWithRangeAndPresetsControlled({
  className,
  date,
  setDate,
  ...props
}: DatePickerWithRangeAndPresetsProps) {
  // Local state fallback if not controlled externally
  const [localDate, setLocalDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  // Use either controlled or uncontrolled date
  const selectedDate = date || localDate;
  const handleDateChange = setDate || setLocalDate;

  return (
    <div className={cn('grid gap-2', className)} {...props}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate?.from ? (
              selectedDate.to ? (
                <>
                  {format(selectedDate.from, 'LLL dd, y')} - {format(selectedDate.to, 'LLL dd, y')}
                </>
              ) : (
                format(selectedDate.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <Select
            onValueChange={(value) => {
              const today = new Date();

              switch (value) {
                case 'today':
                  handleDateChange({ from: today, to: today });
                  break;
                case 'yesterday':
                  const yesterday = subDays(today, 1);
                  handleDateChange({ from: yesterday, to: yesterday });
                  break;
                case '7days':
                  handleDateChange({ from: subDays(today, 7), to: today });
                  break;
                case '30days':
                  handleDateChange({ from: subDays(today, 30), to: today });
                  break;
                case '90days':
                  handleDateChange({ from: subMonths(today, 3), to: today });
                  break;
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-md border mt-2">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={selectedDate?.from}
              selected={selectedDate}
              onSelect={handleDateChange}
              numberOfMonths={2}
              disabled={{
                before: subMonths(new Date(), 3),
                after: new Date(),
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
