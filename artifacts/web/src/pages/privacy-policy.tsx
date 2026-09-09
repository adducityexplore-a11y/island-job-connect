import { LegalPage, LegalSection } from "./legal-page";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" canonicalPath="/privacy-policy" description="How The Jobs MV collects, uses, and protects personal information.">
      <LegalSection heading="Our commitment to privacy"><p>The Jobs MV respects your privacy. This policy explains how we handle information when you use our hospitality recruitment platform and related services.</p></LegalSection>
      <LegalSection heading="Information we collect"><p>We collect information you provide, such as your name, contact details, account information, employment history, qualifications, CV, application details, and communications with us. We may also collect technical information needed to operate and secure the platform.</p></LegalSection>
      <LegalSection heading="How we use information"><p>We use personal information to provide recruitment services, create and maintain accounts, match candidates with opportunities, process applications, communicate with users, improve our services, and meet legal and security obligations.</p></LegalSection>
      <LegalSection heading="Sharing information"><p>Candidate information is shared with employers only as needed to support a role, application, or recruitment process, and in line with the candidate’s choices. We may also use trusted service providers that help us operate the platform.</p></LegalSection>
      <LegalSection heading="Your choices and contact"><p>You may request access to, correction of, or deletion of your personal information, subject to applicable obligations. Contact us at <a className="text-secondary underline underline-offset-4" href="mailto:hello@thejobsmv.com">hello@thejobsmv.com</a> for privacy questions or requests.</p></LegalSection>
    </LegalPage>
  );
}