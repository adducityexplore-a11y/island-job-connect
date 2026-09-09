import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Department, Job, SAMPLE_JOBS } from "@/constants/data";

const STORAGE_KEY = "job_alerts_v1";

export interface JobAlert {
  id: string;
  label: string;
  department: Department;
  keyword: string;
  location: string;
  createdAt: string;
  seenJobIds: string[];
}

interface JobAlertsContextValue {
  alerts: JobAlert[];
  addAlert: (opts: {
    label: string;
    department: Department;
    keyword: string;
    location: string;
  }) => Promise<void>;
  removeAlert: (id: string) => Promise<void>;
  markAlertSeen: (alertId: string, jobIds: string[]) => Promise<void>;
  getNewMatches: (alert: JobAlert, allJobs: Job[]) => Job[];
  totalUnread: number;
}

const JobAlertsContext = createContext<JobAlertsContextValue | null>(null);

export function useJobAlerts() {
  const ctx = useContext(JobAlertsContext);
  if (!ctx) throw new Error("useJobAlerts must be used inside JobAlertsProvider");
  return ctx;
}

function matchesAlert(job: Job, alert: JobAlert): boolean {
  const deptMatch = alert.department === "All" || job.department === alert.department;
  const q = alert.keyword.toLowerCase().trim();
  const keywordMatch =
    q === "" ||
    job.title.toLowerCase().includes(q) ||
    job.company.toLowerCase().includes(q) ||
    job.department.toLowerCase().includes(q);
  const loc = alert.location.toLowerCase().trim();
  const locationMatch =
    loc === "" || job.location.toLowerCase().includes(loc);
  return deptMatch && keywordMatch && locationMatch;
}

export function JobAlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setAlerts(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const persist = useCallback(async (next: JobAlert[]) => {
    setAlerts(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addAlert = useCallback(
    async (opts: {
      label: string;
      department: Department;
      keyword: string;
      location: string;
    }) => {
      const existingIds = SAMPLE_JOBS.filter((j) =>
        matchesAlert(j, { ...opts, id: "", createdAt: "", seenJobIds: [] })
      ).map((j) => j.id);
      const alert: JobAlert = {
        id: Date.now().toString(),
        ...opts,
        createdAt: new Date().toISOString(),
        seenJobIds: existingIds,
      };
      await persist([...alerts, alert]);
    },
    [alerts, persist]
  );

  const removeAlert = useCallback(
    async (id: string) => {
      await persist(alerts.filter((a) => a.id !== id));
    },
    [alerts, persist]
  );

  const markAlertSeen = useCallback(
    async (alertId: string, jobIds: string[]) => {
      const next = alerts.map((a) =>
        a.id === alertId
          ? { ...a, seenJobIds: [...new Set([...a.seenJobIds, ...jobIds])] }
          : a
      );
      await persist(next);
    },
    [alerts, persist]
  );

  const getNewMatches = useCallback(
    (alert: JobAlert, allJobs: Job[]): Job[] => {
      return allJobs.filter(
        (j) => matchesAlert(j, alert) && !alert.seenJobIds.includes(j.id)
      );
    },
    []
  );

  const totalUnread = useMemo(() => {
    let count = 0;
    for (const alert of alerts) {
      count += SAMPLE_JOBS.filter(
        (j) => matchesAlert(j, alert) && !alert.seenJobIds.includes(j.id)
      ).length;
    }
    return count;
  }, [alerts]);

  return (
    <JobAlertsContext.Provider
      value={{ alerts, addAlert, removeAlert, markAlertSeen, getNewMatches, totalUnread }}
    >
      {children}
    </JobAlertsContext.Provider>
  );
}
