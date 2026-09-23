import { LegalPage, P, Section } from '@/components/LegalPage';
import { APP_NAME, CONTACT_EMAIL } from '@/constants/app';

export default function PrivacyScreen() {
  return (
    <LegalPage title="Privacy Policy" updated="September 23, 2026">
      <P>
        {APP_NAME} helps you learn German from photos of products and signs. This policy explains
        what data the app uses and where it is stored.
      </P>

      <Section heading="Google account">
        <P>
          You sign in with your Google account. {APP_NAME} receives your name, email address and
          profile picture to show who is signed in, and permission to use a private app folder in
          your Google Drive. The sign-in token is kept in your browser or device so you stay signed
          in, and it is removed when you sign out.
        </P>
      </Section>

      <Section heading="Your flashcards and photos">
        <P>
          Flashcards and the photos you save with them are stored only in your own Google Drive, in
          a hidden folder that only {APP_NAME} can access (the Google Drive “appDataFolder”). The
          app cannot see any of your other Drive files. {APP_NAME} does not run its own database and
          does not keep a copy of your flashcards.
        </P>
        <P>
          You can delete this data at any time in Google Drive → Settings → Manage apps → {APP_NAME}{' '}
          → Delete hidden app data, and you can remove the app’s access in your Google Account under
          Security → Third-party apps with account access.
        </P>
      </Section>

      <Section heading="Image analysis">
        <P>
          When you scan a photo, it is sent to our server and passed to the Google Gemini API to
          find German words and write translations and explanations. Our server does not store the
          photo. Google processes it under the Gemini API terms; on the free tier, Google may use
          submitted content to improve its products.
        </P>
      </Section>

      <Section heading="Google user data">
        <P>
          {APP_NAME}’s use and transfer of information received from Google APIs adheres to the
          Google API Services User Data Policy, including the Limited Use requirements. Google user
          data is used only to provide the app’s features, is not sold, is not used for advertising,
          and is not shared with anyone except as described above.
        </P>
      </Section>

      <Section heading="Analytics and cookies">
        <P>{APP_NAME} does not use analytics, advertising or tracking cookies.</P>
      </Section>

      <Section heading="Contact">
        <P>Questions about this policy: {CONTACT_EMAIL}</P>
      </Section>
    </LegalPage>
  );
}
