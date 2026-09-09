import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetCandidateProfile, useUpsertCandidateProfile, getGetCandidateProfileQueryKey } from "@workspace/api-client-react";

export interface CandidateProfile {
  name: string;
  phone: string;
  email: string;
  location: string;
  experience: string;
  preferredDepartment: string;
  availability: string;
  expectedSalary: string;
  cvAvailable: boolean;
  cvFileName: string;
}

interface ProfileContextType {
  profile: CandidateProfile;
  updateProfile: (updates: Partial<CandidateProfile>) => Promise<void>;
  isLoaded: boolean;
}

const DEFAULT_PROFILE: CandidateProfile = {
  name: "",
  phone: "",
  email: "",
  location: "",
  experience: "",
  preferredDepartment: "",
  availability: "",
  expectedSalary: "",
  cvAvailable: false,
  cvFileName: "",
};

const ProfileContext = createContext<ProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: async () => {},
  isLoaded: false,
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);
  const { isSignedIn } = useAuth();

  const { data: apiProfile, isSuccess } = useGetCandidateProfile({ 
    query: {
      enabled: isSignedIn === true,
      retry: false,
      queryKey: getGetCandidateProfileQueryKey(),
    },
  });
  const upsertProfile = useUpsertCandidateProfile();

  useEffect(() => {
    // Try to load from AsyncStorage first
    AsyncStorage.getItem("candidate_profile").then((data) => {
      if (data) {
        setProfile(JSON.parse(data) as CandidateProfile);
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isSuccess && apiProfile) {
      setProfile((prev) => ({
        ...prev,
        name: apiProfile.fullName || prev.name,
        email: apiProfile.email || prev.email,
        phone: apiProfile.phone || prev.phone,
        location: apiProfile.location || prev.location,
        cvAvailable: apiProfile.cvAvailable,
        cvFileName: apiProfile.cvAvailable ? prev.cvFileName : "",
      }));
    }
  }, [apiProfile, isSuccess]);

  const updateProfile = async (updates: Partial<CandidateProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    await AsyncStorage.setItem("candidate_profile", JSON.stringify(updated));

    if (!isSignedIn) return;

    // Sync authenticated candidate profiles to the server.
    try {
      await upsertProfile.mutateAsync({
        data: {
          email: updated.email || "no-reply@example.com", // email is required in API
          fullName: updated.name || "Unknown Candidate", // fullName is required
          phone: updated.phone,
          location: updated.location,
          yearsExperience: updated.experience,
          hospitalitySpecialties: updated.preferredDepartment,
          availability: updated.availability,
        }
      });
    } catch (e) {
      console.log("Candidate profile API sync skipped (auth or network error)");
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, isLoaded }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
