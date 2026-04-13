import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  name: string
  required?: boolean
}

export function DateTimePicker({ name, required }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>()
  const [time, setTime] = React.useState<string>("")

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value)
    if (date && e.target.value) {
      const [hours, minutes] = e.target.value.split(":")
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours, 10))
      newDate.setMinutes(parseInt(minutes, 10))
      setDate(newDate)
    }
  }

  const handleSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined)
      return
    }
    
    if (time) {
      const [hours, minutes] = time.split(":")
      newDate.setHours(parseInt(hours, 10))
      newDate.setMinutes(parseInt(minutes, 10))
    }
    setDate(newDate)
  }

  return (
    <>
      <input 
          type="hidden" 
          name={name} 
          value={date ? date.toISOString() : ''} 
          required={required} 
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal border-input bg-background hover:bg-accent hover:text-accent-foreground",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP p") : <span>Pick a date & time</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-border" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            className="pointer-events-auto"
          />
          <div className="p-3 border-t border-border flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input 
                  type="time" 
                  value={time}
                  onChange={handleTimeChange}
                  className="flex-1 border-input bg-background focus-visible:ring-ring"
              />
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
