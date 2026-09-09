import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { Job } from "@/constants/data";

const STORAGE_KEY = "posted_jobs";

interface PostedJobsContextValue {
  postedJobs: Job[];
  addJob: (job: Job) => Promise<void>;
  removeJob: (id: string) => Promise<void>;
}

const PostedJobsContext = createContext<PostedJobsContextValue>({
  postedJobs: [],
  addJob: async () => {},
  removeJob: async () => {},
});

export function PostedJobsProvider({ children }: { children: React.ReactNode }) {
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setPostedJobs(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const persist = useCallback(async (jobs: Job[]) => {
    setPostedJobs(jobs);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, []);

  const addJob = useCallback(async (job: Job) => {
    setPostedJobs((prev) => {
      const next = [job, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeJob = useCallback(async (id: string) => {
    setPostedJobs((prev) => {
      const next = prev.filter((j) => j.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [persist]);

  return (
    <PostedJobsContext.Provider value={{ postedJobs, addJob, removeJob }}>
      {children}
    </PostedJobsContext.Provider>
  );
}

export function usePostedJobs() {
  return useContext(PostedJobsContext);
}
