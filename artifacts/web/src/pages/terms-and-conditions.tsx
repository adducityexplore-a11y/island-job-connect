import { LegalPage, LegalSection } from "./legal-page";

export default function TermsAndConditions() {
  return (
    <LegalPage title="Terms and Conditions" canonicalPath="/terms-and-conditions" description="The terms for using The Jobs MV hospitality recruitment platform.">
      <LegalSection heading="Acceptance of these terms"><p>By accessing or using The Jobs MV, you agree to these terms and to use the platform lawfully, responsibly, and only for genuine recruitment and career purposes.</p></LegalSection>
      <LegalSection heading="Accounts and information"><p>You are responsible for information submitted through your account and for keeping your access credentials secure. Information must be accurate, current, and must not infringe another person’s rights.</p></LegalSection>
      <LegalSection heading="Platform use"><p>The Jobs MV provides a service that helps candidates and employers connect. We do not guarantee employment, interviews, offers, or any particular recruitment outcome. Hiring decisions remain the responsibility of the relevant employer.</p></LegalSection>
      <LegalSection heading="Prohibited conduct"><p>You must not misuse the platform, submit misleading content, interfere with its operation, scrape data, or use another person’s information without permission.</p></LegalSection>
      <LegalSection heading="Changes and contact"><p>We may update these terms as our services evolve. Questions about these terms can be sent to <a className="text-secondary underline underline-offset-4" href="mailto:hello@thejobsmv.com">hello@thejobsmv.com</a>.</p></LegalSection>
    </LegalPage>
  );
}