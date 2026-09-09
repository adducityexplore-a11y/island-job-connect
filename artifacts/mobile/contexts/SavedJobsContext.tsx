import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface SavedJobsContextType {
  savedIds: string[];
  toggleSaved: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;
}

const SavedJobsContext = createContext<SavedJobsContextType>({
  savedIds: [],
  toggleSaved: async () => {},
  isSaved: () => false,
});

export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("saved_jobs").then((data) => {
      if (data) setSavedIds(JSON.parse(data) as string[]);
    });
  }, []);

  const toggleSaved = async (id: string) => {
    const updated = savedIds.includes(id)
      ? savedIds.filter((s) => s !== id)
      : [...savedIds, id];
    setSavedIds(updated);
    await AsyncStorage.setItem("saved_jobs", JSON.stringify(updated));
  };

  const isSaved = (id: string) => savedIds.includes(id);

  return (
    <SavedJobsContext.Provider value={{ savedIds, toggleSaved, isSaved }}>
      {children}
    </SavedJobsContext.Provider>
  );
}

export function useSavedJobs() {
  return useContext(SavedJobsContext);
}
