import { useState, useEffect, useRef } from 'react';
import { TIMEZONE } from '../utils/constants';

/**
 * Hook that provides a real-time clock updating every second
 * Returns current Date object and formatted time string (HH:mm:ss)
 */
export function useClock() {
  const [date, setDate] = useState(() => new Date());

  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const timeString = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: TIMEZONE,
  });

  return { date, timeString };
}

export default useClock;
