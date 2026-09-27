import { useEffect, useState } from "react";

export function useCountdown(active: boolean, resetKey: number, seconds: number): number {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [seenKey, setSeenKey] = useState(resetKey);

  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setTimeLeft(seconds);
  }

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, resetKey]);

  return timeLeft;
}
