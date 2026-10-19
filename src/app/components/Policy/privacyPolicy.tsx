import styles from "./policy.module.css";

export default function PrivacyPolicy() {
  return (
    <div className={styles.page}>
      <div className={styles.policy}>
        <h1>Privacy Policy</h1>

        <section>
          <h2>Introduction</h2>
          <p>
            This Privacy Policy describes how Ambiance Maker collects, uses, and
            handles information when you use our website and services.
          </p>
        </section>

        <section>
          <h2>Information We Collect</h2>

          <h3>Account Information</h3>
          <p>
            Accounts are created through third-party authentication. When you
            authenticate, we may receive basic profile information such as your
            email address, display name, and profile picture from the provider.
          </p>

          <h3>Profile Information</h3>
          <p>
            A username is automatically assigned when you create an account and
            can be updated through the settings page. Your profile page and
            username become publicly visible once you have published content on
            the website.
          </p>

          <h3>Content You Create</h3>
          <p>When you use the website, we may store information including:</p>
          <ul>
            <li>Ambiance titles and descriptions</li>
            <li>
              Ambiance configurations: YouTube video selections and associated
              playback settings
            </li>
            <li>Ambiances you have favorited and star ratings you submit</li>
          </ul>

          <h3>Reports</h3>
          <p>
            If you submit a report, the content of that report may be retained
            as needed for site operation and moderation purposes.
          </p>

          <h3>Usage Information</h3>
          <p>
            The site may collect basic usage statistics such as page view counts
            and ambiance view counts to help understand how the service is used.
          </p>
        </section>

        <section>
          <h2>Cookies and Local Storage</h2>
          <p>The website uses browser storage technologies including:</p>
          <ul>
            <li>
              <strong>Session cookies:</strong> Used to maintain your login
              session while you are signed in
            </li>
            <li>
              <strong>Local storage:</strong> Used to remember site preferences
              such as menu state
            </li>
            <li>
              <strong>Third-party cookies:</strong> Third-party services we use,
              including authentication providers and YouTube for embedded video
              playback, may set their own cookies subject to their own privacy
              policies
            </li>
          </ul>
        </section>

        <section>
          <h2>How Your Information Is Used</h2>
          <ul>
            <li>To create and manage your account</li>
            <li>To enable login and maintain your session</li>
            <li>To store and display your content</li>
            <li>To facilitate content review and moderation</li>
            <li>To track basic usage statistics</li>
            <li>To send account-related communications where applicable</li>
          </ul>
        </section>

        <section>
          <h2>Data Sharing and Disclosure</h2>
          <p>
            Personal information is not sold or rented to third parties.
            Information may be shared only in limited circumstances:
          </p>
          <ul>
            <li>
              <strong>Service providers:</strong> With third-party services that
              help operate the website, such as authentication and data storage
              providers
            </li>
            <li>
              <strong>Legal requirements:</strong> When required by applicable
              law
            </li>
            <li>
              <strong>Aggregated data:</strong> Anonymized or aggregated usage
              statistics may be shared or published
            </li>
          </ul>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>
            This website uses third-party services for authentication and embeds
            video content from YouTube. These services operate under their own
            terms and privacy policies. Ambiance Maker is not affiliated with,
            endorsed by, or sponsored by Google LLC, YouTube, or any of their
            subsidiaries.
          </p>
          <h3>YouTube API Services</h3>
          <p>
            Ambiance Maker uses YouTube API Services to embed and play videos.
            When a video is loaded or played, YouTube may collect information
            about your device and viewing activity as described in the{" "}
            <a
              className={styles.link}
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Privacy Policy
            </a>
            . Use of YouTube content on this website is also subject to the{" "}
            <a
              className={styles.link}
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube Terms of Service
            </a>
            .
          </p>
        </section>

        <section>
          <h2>Data Security</h2>
          <p>
            Reasonable measures are used to protect your information. However,
            no method of data transmission or storage is completely secure, and
            we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>Your Rights and Choices</h2>
          <ul>
            <li>
              You may update your username through the settings page, subject to
              eligibility
            </li>
            <li>
              You may delete your account at any time through the settings page
            </li>
            <li>
              Upon account deletion, your personal information will be removed.
              Some content or aggregated data may be retained for a period we
              determine appropriate
            </li>
          </ul>
        </section>

        <section>
          <h2>Age Requirement</h2>
          <p>To create an account, you must be at least 13 years of age.</p>
        </section>

        <section>
          <h2>Advertising</h2>
          <p>
            The website may display advertisements. Advertising partners may use
            their own cookies and tracking technologies, subject to their own
            privacy policies.
          </p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            This Privacy Policy may be updated from time to time. Changes will
            be posted on this page. Continued use of the website after changes
            are posted means you accept the updated policy.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us
            at: <span className={styles.email}>support@ambiancemaker.com</span>
          </p>
        </section>
      </div>
    </div>
  );
}
