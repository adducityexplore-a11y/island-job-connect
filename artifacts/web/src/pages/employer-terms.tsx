import { LegalPage, LegalSection } from "./legal-page";

export default function EmployerTerms() {
  return (
    <LegalPage title="Employer Terms" canonicalPath="/employer-terms" description="Terms for employers using The Jobs MV to advertise roles and recruit candidates.">
      <LegalSection heading="Employer responsibilities"><p>Employers must provide complete, accurate, and lawful vacancy information. You are responsible for your hiring decisions, communications, workplace conditions, and compliance with applicable employment and data-protection requirements.</p></LegalSection>
      <LegalSection heading="Candidate information"><p>Candidate profiles, CVs, and application details are provided for legitimate recruitment purposes only. Employers must keep this information confidential, limit access to authorised people, and not use it for unrelated marketing or disclosure.</p></LegalSection>
      <LegalSection heading="Job listings"><p>Listings must describe genuine opportunities and must not be discriminatory, misleading, fraudulent, or unlawful. The Jobs MV may remove or restrict listings that do not meet these requirements.</p></LegalSection>
      <LegalSection heading="Recruitment services"><p>Where The Jobs MV provides managed recruitment support, the agreed service scope and any applicable commercial terms will be confirmed separately. Employers remain responsible for final selection and employment arrangements.</p></LegalSection>
      <LegalSection heading="Contact"><p>For employer terms or recruitment service questions, contact <a className="text-secondary underline underline-offset-4" href="mailto:hello@thejobsmv.com">hello@thejobsmv.com</a>.</p></LegalSection>
    </LegalPage>
  );
}