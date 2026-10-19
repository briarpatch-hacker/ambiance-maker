import styles from "./policy.module.css";

export default function TermsOfService() {
  return (
    <div className={styles.page}>
      <div className={styles.policy}>
        <h1>Terms of Service</h1>

        <section>
          <h2>Agreement to Terms</h2>
          <p>By using Ambiance Maker, you agree to these Terms of Service.</p>
        </section>

        <section>
          <h2>About the Service</h2>
          <p>
            Ambiance Maker is a website that allows users to create, save, and
            share custom audio experiences built from embedded YouTube videos.
            Users may also browse and listen to ambiances created and published
            by other users.
          </p>
        </section>

        <section>
          <h2>User Accounts</h2>
          <p>
            Accounts are created through third-party sign-in. By creating an
            account:
          </p>
          <ul>
            <li>You must be at least 13 years of age</li>
            <li>
              You are responsible for all activity that occurs under your
              account
            </li>
            <li>You must not misrepresent your identity</li>
          </ul>
          <p>
            You may delete your account at any time through the settings page.
            Upon deletion, your account data will be handled as described in the
            Privacy Policy.
          </p>
        </section>

        <section>
          <h2>User Content</h2>
          <p>
            Ambiance Maker allows you to create and submit ambiances for
            potential publication on the website. When you submit content:
          </p>
          <ul>
            <li>
              Submissions are subject to review and may be accepted, rejected,
              or removed at our discretion
            </li>
            <li>Accepted content may be publicly displayed on the website</li>
            <li>
              We do not guarantee that submitted content will be published or
              remain available indefinitely
            </li>
            <li>
              You may delete your own drafts and published ambiances through the
              website at any time
            </li>
          </ul>
        </section>

        <section>
          <h2>Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>
              Attempt to gain unauthorized access to the website or its systems
            </li>
            <li>Use automated tools or scripts to interact with the website</li>
            <li>
              Submit content that is illegal, harmful, or otherwise
              inappropriate
            </li>
            <li>
              Engage in activity intended to disrupt or degrade the
              website&apos;s operation
            </li>
            <li>Use the website for any unlawful purpose</li>
          </ul>
        </section>

        <section>
          <h2>Account Access</h2>
          <p>
            We reserve the right to restrict, suspend, or terminate access to
            the website at our discretion, with or without notice.
          </p>
        </section>

        <section>
          <h2>Third-Party Content</h2>
          <p>
            Ambiances do not contain video or audio files. They reference
            publicly available YouTube videos and play them through
            YouTube&apos;s embedded player. Ambiance Maker does not host, copy,
            or distribute this content, and all videos remain the property of
            their respective owners. We are not responsible for the
            availability, accuracy, or appropriateness of embedded content.
          </p>
          <p>
            Ambiance Maker uses YouTube API Services. By using the website, you
            agree to be bound by the{" "}
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
          <p>
            You are responsible for the videos you include in your ambiances.
            Video owners may request removal of their content from the website
            by contacting us at the address below.
          </p>
        </section>

        <section>
          <h2>Reports</h2>
          <p>
            Users may submit reports regarding content on the website. While we
            review reports in good faith, we cannot guarantee a specific outcome
            or response for every submission.
          </p>
        </section>

        <section>
          <h2>Service Availability</h2>
          <p>
            Features may be modified, updated, or discontinued at any time. The
            website may occasionally be unavailable due to maintenance or other
            reasons.
          </p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>
            We do our best to keep things running, but make no guarantees about
            uptime, availability, or data persistence.
          </p>
        </section>

        <section>
          <h2>Advertising</h2>
          <p>
            The website may display advertisements to support operating costs.
          </p>
        </section>

        <section>
          <h2>Changes to These Terms</h2>
          <p>
            These Terms of Service may be updated from time to time. Changes
            will be posted on this page. Continued use of the website after
            changes are posted constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For questions regarding these Terms of Service, please contact us
            at:{" "}
            <a className={styles.link} href="mailto:support@ambiancemaker.com">
              support@ambiancemaker.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
