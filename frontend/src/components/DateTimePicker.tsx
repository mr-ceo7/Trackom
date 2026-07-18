import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:MM" format
  onChange: (val: string) => void;
  minDate?: Date;
}

export default function DateTimePicker({ value, onChange, minDate = new Date() }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current state values
  const now = new Date();
  const initialDate = value ? new Date(value) : now;

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Selected state
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [selectedHour, setSelectedHour] = useState(initialDate.getHours() % 12 || 12);
  const [selectedMinute, setSelectedMinute] = useState(initialDate.getMinutes());
  const [selectedAmPm, setSelectedAmPm] = useState(initialDate.getHours() >= 12 ? 'PM' : 'AM');

  // Sync state with value prop when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
        setSelectedDay(d.getDate());
        setSelectedHour(d.getHours() % 12 || 12);
        setSelectedMinute(d.getMinutes());
        setSelectedAmPm(d.getHours() >= 12 ? 'PM' : 'AM');
      }
    }
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  // Create days grid cells (total 42 to fit 6-week layout)
  const cells: { day: number; type: 'prev' | 'current' | 'next'; date: Date }[] = [];

  // 1. Trailing days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    cells.push({ day, type: 'prev', date: new Date(y, m, day) });
  }

  // 2. Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, type: 'current', date: new Date(currentYear, currentMonth, i) });
  }

  // 3. Leading days from next month
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    cells.push({ day: i, type: 'next', date: new Date(y, m, i) });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (cell: typeof cells[0]) => {
    setSelectedDay(cell.day);
    setCurrentMonth(cell.date.getMonth());
    setCurrentYear(cell.date.getFullYear());
  };

  const handleConfirm = () => {
    // Construct final date string
    let militaryHour = selectedHour % 12;
    if (selectedAmPm === 'PM') militaryHour += 12;
    
    const finalDate = new Date(currentYear, currentMonth, selectedDay, militaryHour, selectedMinute);
    
    // Format to YYYY-MM-DDTHH:MM (local time string)
    const yyyy = finalDate.getFullYear();
    const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
    const dd = String(finalDate.getDate()).padStart(2, '0');
    const hh = String(finalDate.getHours()).padStart(2, '0');
    const min = String(finalDate.getMinutes()).padStart(2, '0');
    
    onChange(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
    
    const hrs = today.getHours();
    setSelectedHour(hrs % 12 || 12);
    setSelectedMinute(today.getMinutes());
    setSelectedAmPm(hrs >= 12 ? 'PM' : 'AM');
  };

  // Nice readable display string
  const formatDisplay = () => {
    if (!value) return 'Select date & time...';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Select date & time...';
    
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all flex items-center justify-between text-left cursor-pointer hover:border-slate-400 dark:hover:border-white/20 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5"
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-brand-primary" />
          <span className={value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
            {formatDisplay()}
          </span>
        </span>
        <Clock className="w-4 h-4 text-slate-400" />
      </button>

      {/* Popover Calendar Modal */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-[90] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-4 w-[320px] sm:w-[460px] flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          
          <div className="flex flex-col sm:flex-row gap-4">
            
            {/* Calendar Widget (Left side on desktop) */}
            <div className="flex-1 space-y-2.5">
              {/* Header Navigation */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {months[currentMonth]} {currentYear}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {cells.map((cell, idx) => {
                  const isSelected = cell.day === selectedDay && cell.type === 'current';
                  const isToday = cell.date.toDateString() === new Date().toDateString();
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDay(cell)}
                      className={`text-xs py-1 rounded-lg transition-all font-mono cursor-pointer ${
                        isSelected
                          ? 'bg-brand-primary text-white font-bold'
                          : cell.type === 'current'
                          ? 'text-slate-300 hover:bg-white/5'
                          : 'text-slate-600 hover:bg-white/5 opacity-50'
                      } ${isToday && !isSelected ? 'border border-brand-primary/50' : ''}`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separator / Time Widget (Right side on desktop) */}
            <div className="w-full sm:w-px sm:h-auto bg-slate-800" />

            <div className="w-full sm:w-[130px] flex flex-col justify-start gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-left flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Time
              </span>

              {/* Time Selection Fields */}
              <div className="flex sm:flex-col gap-2">
                {/* Hour */}
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 text-left">Hour</span>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none cursor-pointer w-full font-mono"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                {/* Minute */}
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 text-left">Minute</span>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none cursor-pointer w-full font-mono"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                {/* AM/PM */}
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 text-left">AM/PM</span>
                  <select
                    value={selectedAmPm}
                    onChange={(e) => setSelectedAmPm(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none cursor-pointer w-full font-mono font-bold"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-slate-800 justify-between items-center mt-1">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[10px] font-black uppercase text-slate-400 hover:text-white cursor-pointer bg-transparent border-0"
            >
              Today
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black uppercase px-3 py-1.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="text-[10px] font-black uppercase px-3 py-1.5 bg-brand-primary text-white rounded-xl cursor-pointer hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20"
              >
                Confirm
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
