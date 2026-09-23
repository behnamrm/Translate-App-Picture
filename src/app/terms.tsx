import { LegalPage, P, Section } from '@/components/LegalPage';
import { APP_NAME, CONTACT_EMAIL } from '@/constants/app';

export default function TermsScreen() {
  return (
    <LegalPage title="Terms of Service" updated="September 23, 2026">
      <P>By using {APP_NAME} you agree to these terms.</P>

      <Section heading="The service">
        <P>
          {APP_NAME} is a free language-learning tool. Translations and explanations are generated
          by AI and may contain mistakes, so please double-check anything important. The service is
          provided “as is”, without warranties, and may change or stop at any time.
        </P>
      </Section>

      <Section heading="Fair use">
        <P>
          Please use the app for personal learning. Do not upload illegal content, try to overload
          or misuse the service, or use it to process other people’s personal data without
          permission. Scans may be limited when the shared AI quota is reached.
        </P>
      </Section>

      <Section heading="Your data">
        <P>
          Your flashcards stay in your own Google Drive and remain yours. See the Privacy Policy for
          details.
        </P>
      </Section>

      <Section heading="Contact">
        <P>{CONTACT_EMAIL}</P>
      </Section>
    </LegalPage>
  );
}
