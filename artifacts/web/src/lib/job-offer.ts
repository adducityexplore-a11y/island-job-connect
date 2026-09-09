import type { Disclosure, PublicJob } from "@workspace/api-client-react";

type OfferField = {
  label: string;
  value: string | number | null | undefined;
  disclosure: Disclosure | undefined;
};

export function formatDeadline(date: string | null | undefined) {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatJobFreshness(job: PublicJob) {
  const dateStr = job.publishedAt || job.createdAt;
  let postedPart = "";
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
      const diffTime = Math.abs(new Date().getTime() - parsed.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        postedPart = "Posted today";
      } else if (diffDays === 1) {
        postedPart = "Posted 1 day ago";
      } else if (diffDays <= 7) {
        postedPart = `Posted ${diffDays} days ago`;
      } else {
        postedPart = `Posted ${parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
      }
    }
  }

  let closesPart = "";
  if (job.applicationDeadline) {
    const deadline = formatDeadline(job.applicationDeadline);
    if (deadline) {
      closesPart = `Closes ${deadline}`;
    }
  }

  if (postedPart && closesPart) {
    return `${postedPart} • ${closesPart}`;
  }
  return postedPart || closesPart || null;
}

export function offerValue({ value, disclosure }: OfferField) {
  if (disclosure === "not_disclosed") return "Not disclosed";
  if (value !== null && value !== undefined && String(value).trim()) return String(value);
  return "Information not published";
}

export function salaryValue(job: PublicJob) {
  if (job.salaryDisclosure === "not_disclosed") return "Not disclosed";
  const values = [job.salaryMin, job.salaryMax].filter(
    (value): value is number => typeof value === "number",
  );
  if (!values.length || !job.salaryCurrency) return "Information not published";

  const formatter = new Intl.NumberFormat("en-US");
  const formattedValues = values.map(v => formatter.format(v));
  const amount = values.length === 2 && values[0] !== values[1]
    ? `${formattedValues[0]}–${formattedValues[1]}`
    : formattedValues[0];

  const period = job.salaryPeriod ? `/${job.salaryPeriod}` : "";
  return `${job.salaryCurrency} ${amount}${period}`;
}

export function getOfferIndicators(job: PublicJob) {
  const indicators: OfferField[] = [
    { label: "Salary", value: job.salaryMin ?? job.salaryMax, disclosure: job.salaryDisclosure },
    { label: "Service Charge", value: job.serviceCharge, disclosure: job.serviceChargeDisclosure },
    { label: "Accommodation", value: job.accommodation, disclosure: job.accommodationDisclosure },
  ];

  return indicators
    .filter(({ value, disclosure }) => disclosure === "not_disclosed" || (value !== null && value !== undefined && String(value).trim()))
    .map((indicator) => ({
      label: indicator.label,
      value: indicator.label === "Salary" ? salaryValue(job) : offerValue(indicator),
    }));
}

export function getCompactOfferIndicators(job: PublicJob) {
  const indicators: string[] = [];

  const salary = salaryValue(job);
  if (salary !== "Information not published") {
    if (salary === "Not disclosed") {
      indicators.push(`Salary: ${salary}`);
    } else {
      indicators.push(salary);
    }
  }

  const hasServiceCharge = job.serviceChargeDisclosure === "provided" || (job.serviceCharge && job.serviceCharge.trim() && job.serviceChargeDisclosure !== "not_disclosed");
  if (hasServiceCharge) {
    indicators.push("Service Charge");
  }

  const hasAccommodation = job.accommodationDisclosure === "provided" || (job.accommodation && job.accommodation.trim() && job.accommodationDisclosure !== "not_disclosed");
  if (hasAccommodation) {
    indicators.push("Accommodation");
  }

  return indicators;
}
