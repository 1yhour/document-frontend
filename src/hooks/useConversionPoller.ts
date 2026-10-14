"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import conversionApi from "@/lib/api/conversions";
import { Conversion, ConversionStatus } from "@/types/conversion";
import axios from "axios";

const TERMINAL_STATUSES: ConversionStatus[] = ["completed", "failed"];
const POLL_INTERVAL_MS = 1500;
const MAX_CONSECUTIVE_ERRORS = 4;

export interface UseConversionPollerResult {
  conversion: Conversion | null;
  isPolling: boolean;
  pollError: string | null;
  startPolling: (id: string) => void;
  stopPolling: () => void;
  clearConversion: () => void;
}

/**
 * Polls GET /api/conversions/{id} every 1.5 s until the conversion reaches
 * a terminal state (completed | failed), or until MAX_CONSECUTIVE_ERRORS
 * network errors occur in a row.
 *
 * Safe: clears the interval on unmount and on every new poll start.
 */
export function useConversionPoller(): UseConversionPollerResult {
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    activeIdRef.current = null;
  }, []);

  const clearConversion = useCallback(() => {
    setConversion(null);
    setPollError(null);
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      // Clear any previous poll
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      activeIdRef.current = id;
      consecutiveErrorsRef.current = 0;
      setPollError(null);
      setIsPolling(true);

      const tick = async () => {
        const currentId = activeIdRef.current;
        if (!currentId) return;

        try {
          const data = await conversionApi.getStatus(currentId);
          consecutiveErrorsRef.current = 0;

          setConversion(data);

          if (TERMINAL_STATUSES.includes(data.status)) {
            stopPolling();
          }
        } catch (err: unknown) {
          consecutiveErrorsRef.current += 1;

          let message = "Network error while checking conversion status.";
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 429) {
              message = "Too many requests. Slowing down polling.";
            } else if (err.response?.status === 403) {
              message = "You do not have permission to view this conversion.";
            } else if (err.response?.status === 401) {
              stopPolling();
              return;
            }
          }

          setPollError(message);

          if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
            stopPolling();
          }
        }
      };

      // Run immediately, then every POLL_INTERVAL_MS
      tick();
      intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  // Clean up on unmount — prevents timer leaks
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { conversion, isPolling, pollError, startPolling, stopPolling, clearConversion };
}
