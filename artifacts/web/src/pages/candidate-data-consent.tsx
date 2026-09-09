import { LegalPage, LegalSection } from "./legal-page";

export default function CandidateDataConsent() {
  return (
    <LegalPage title="Candidate Data Consent" canonicalPath="/candidate-data-consent" description="How candidate information may be used and shared through The Jobs MV.">
      <LegalSection heading="Your consent"><p>When you create a candidate profile or apply for a role through The Jobs MV, you authorise us to process the information you submit to provide recruitment and career services.</p></LegalSection>
      <LegalSection heading="Information shared with employers"><p>For a role you apply to, or where you choose to be considered for an opportunity, we may share relevant profile information, CVs, qualifications, work history, and application details with the relevant employer or their authorised hiring team.</p></LegalSection>
      <LegalSection heading="Your control"><p>You should keep your profile accurate and share only information relevant to your career. You can ask us about your information or withdraw consent for future recruitment use by contacting us. Withdrawal does not affect processing already required to manage an existing application or meet legal obligations.</p></LegalSection>
      <LegalSection heading="Retention and security"><p>We retain information only as needed for recruitment services, account administration, legal requirements, and legitimate operational purposes. We use appropriate measures to protect information, but no online service can guarantee absolute security.</p></LegalSection>
      <LegalSection heading="Questions"><p>For questions or a data request, contact <a className="text-secondary underline underline-offset-4" href="mailto:hello@thejobsmv.com">hello@thejobsmv.com</a>.</p></LegalSection>
    </LegalPage>
  );
}