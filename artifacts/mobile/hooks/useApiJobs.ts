import { useEffect, useState } from "react";
import { Job } from "@/constants/data";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

interface ApiJob {
  id: number;
  title: string;
  department: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string | null;
  type: string;
  applyMethod: string;
  applyContact: string;
  imageUrl: string | null;
  expiresAt: string | null;
  viewCount: number;
  applyCount: number;
  createdAt: string;
  companyName: string;
  logoUrl?: string | null;
}

function formatSalary(min: number | null, max: number | null): string | undefined {
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}/mo`;
  if (min) return `From $${min.toLocaleString()}/mo`;
  if (max) return `Up to $${max.toLocaleString()}/mo`;
  return undefined;
}

function mapApiJob(j: ApiJob): Job {
  const tags: ("Featured" | "Urgent")[] = [];
  if (j.type === "Featured") tags.push("Featured");
  if (j.type === "Urgent") tags.push("Urgent");

  return {
    id: `api_${j.id}`,
    numericId: j.id,
    title: j.title,
    company: j.companyName,
    location: j.location,
    department: j.department as Job["department"],
    description: j.description,
    requirements: j.requirements
      ? j.requirements.split("\n").map((r) => r.trim()).filter(Boolean)
      : [],
    deadline: "Open",
    tags,
    salary: formatSalary(j.salaryMin, j.salaryMax),
    applyWhatsApp: j.applyMethod === "whatsapp" ? j.applyContact : undefined,
    applyEmail: j.applyMethod === "email" ? j.applyContact : undefined,
    postedAt: j.createdAt,
    imageUrl: j.imageUrl ?? undefined,
    logoUrl: j.logoUrl ?? undefined,
    viewCount: j.viewCount,
    applyCount: j.applyCount,
  };
}

export async function trackJobView(numericId: number) {
  try {
    await fetch(`${API_BASE}/jobs/${numericId}/view`, { method: "POST" });
  } catch { /* fire-and-forget */ }
}

export async function trackJobApply(numericId: number) {
  try {
    await fetch(`${API_BASE}/jobs/${numericId}/apply`, { method: "POST" });
  } catch { /* fire-and-forget */ }
}

export function useApiJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/jobs`);
      if (!res.ok) throw new Error("Failed to load jobs");
      const data: ApiJob[] = await res.json();
      setJobs(data.map(mapApiJob));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return { jobs, loading, error, refetch: fetchJobs };
}
