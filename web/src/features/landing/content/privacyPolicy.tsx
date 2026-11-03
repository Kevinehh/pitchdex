import { AddressBlock, type LegalDocument } from "../components/LegalPage"

const email = <a href="mailto:hello@cactusmarketing.io">hello@cactusmarketing.io</a>

export const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  effective: "March 25th, 2026",
  related: { to: "/terms", title: "Terms & Conditions" },
  intro: (
    <>
      <p>
        Pitchdex ("Pitchdex," "we," "us," or "our") is operated by Cactus Marketing Inc. We respect
        your privacy and are committed to protecting your personal information.
      </p>
      <p>
        This Privacy Policy explains how we collect, use, store, and disclose information when you
        use the Pitchdex platform and related services.
      </p>
    </>
  ),
  sections: [
    {
      title: "Who We Are",
      body: (
        <>
          <p>
            Pitchdex is an outbound email platform designed to help founders find and reach relevant
            venture capitalists and manage fundraising outreach.
          </p>
          <AddressBlock name="Pitchdex / Cactus Marketing Inc." />
        </>
      ),
    },
    {
      title: "Information We Collect",
      body: (
        <>
          <p>We may collect the following types of information:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Password and login information</li>
            <li>Connected email account information through Google</li>
            <li>Email campaign data</li>
            <li>Uploaded contact lists</li>
            <li>VC contact data</li>
            <li>Outreach history</li>
            <li>Engagement data such as opens, clicks, replies, and bounces</li>
            <li>Account notes</li>
            <li>Integration data</li>
            <li>Billing-related information</li>
            <li>Support messages and communications</li>
          </ul>
        </>
      ),
    },
    {
      title: "How We Collect Information",
      body: (
        <>
          <p>We collect information:</p>
          <ul>
            <li>directly from you when you create an account or use the platform</li>
            <li>through integrations you connect to Pitchdex</li>
            <li>from imported or uploaded data</li>
            <li>through your use of the platform and related outreach features</li>
          </ul>
        </>
      ),
    },
    {
      title: "How We Use Information",
      body: (
        <>
          <p>We use your information to:</p>
          <ul>
            <li>create and manage your account</li>
            <li>provide the Pitchdex platform and its features</li>
            <li>send and manage outbound email campaigns</li>
            <li>store and display outreach history</li>
            <li>track campaign performance, including opens, clicks, replies, and bounces</li>
            <li>process billing and payments</li>
            <li>provide customer support</li>
            <li>improve platform functionality and analytics</li>
            <li>maintain platform security and integrity</li>
          </ul>
        </>
      ),
    },
    {
      title: "Connected Accounts and Email Functionality",
      body: (
        <>
          <p>
            If you connect your account through Google or other supported integrations, we may
            access and process the information necessary to enable email sending, outreach
            management, and related platform functionality.
          </p>
          <p>
            We store relevant outreach history and campaign performance data to support your ongoing
            use of the service.
          </p>
        </>
      ),
    },
    {
      title: "Payments",
      body: (
        <p>
          Payments may be processed by third-party payment providers such as Stripe. We do not store
          full payment card details ourselves unless expressly stated otherwise. Payment information
          is handled according to the applicable third-party provider's privacy practices.
        </p>
      ),
    },
    {
      title: "Data Storage and Security",
      body: (
        <>
          <p>
            We store necessary account and platform data using AWS and take reasonable measures to
            protect personal information.
          </p>
          <p>
            We use encryption and other reasonable technical and organizational safeguards designed
            to protect your data from unauthorized access, use, disclosure, alteration, or
            destruction. However, no method of transmission or storage is completely secure, and we
            cannot guarantee absolute security.
          </p>
        </>
      ),
    },
    {
      title: "Cookies and Tracking",
      body: (
        <p>
          We do not use cookies for advertising or non-essential tracking based on the information
          currently provided. We may use essential technical mechanisms necessary for platform
          operation, authentication, security, and performance.
        </p>
      ),
    },
    {
      title: "Data Retention",
      body: (
        <>
          <p>
            We retain user data, including account and platform-related data, even if a subscription
            is no longer active, in order to preserve the account and information in case the user
            returns to the platform.
          </p>
          <p>
            We may retain certain information where required for legal, regulatory, security,
            dispute resolution, or legitimate business purposes.
          </p>
        </>
      ),
    },
    {
      title: "How We Share Information",
      body: (
        <>
          <p>
            We may share information with service providers and partners that help us operate the
            platform, including providers for:
          </p>
          <ul>
            <li>cloud hosting and infrastructure</li>
            <li>payment processing</li>
            <li>email and integration functionality</li>
            <li>support and operational services</li>
          </ul>
          <p>We may also disclose information:</p>
          <ul>
            <li>if required by law, regulation, legal process, or governmental request</li>
            <li>to enforce our terms or protect our rights</li>
            <li>in connection with a merger, acquisition, financing, or sale of assets</li>
          </ul>
        </>
      ),
    },
    {
      title: "International Processing",
      body: (
        <p>
          Your information may be stored or processed outside of Canada, including through
          third-party providers such as AWS, Stripe, and Google. By using Pitchdex, you understand
          that your information may be transferred to and processed in other jurisdictions that may
          have different data protection laws than your home jurisdiction.
        </p>
      ),
    },
    {
      title: "Your Choices and Rights",
      body: (
        <>
          <p>You may:</p>
          <ul>
            <li>update certain account information through the platform</li>
            <li>contact us at {email} with privacy-related requests</li>
            <li>delete your account through the in-app settings, where available</li>
          </ul>
          <p>
            Depending on your location, you may also have additional privacy rights under applicable
            law.
          </p>
        </>
      ),
    },
    {
      title: "Children's Privacy",
      body: <p>Pitchdex is intended for founders and is not directed to children.</p>,
    },
    {
      title: "Changes to This Privacy Policy",
      body: (
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we may
          update the effective date above and take other appropriate steps to notify users where
          required.
        </p>
      ),
    },
    {
      title: "Contact Us",
      body: (
        <>
          <p>
            If you have questions about this Privacy Policy or would like to make a privacy-related
            request, please contact:
          </p>
          <AddressBlock name="Pitchdex / Cactus Marketing Inc." />
        </>
      ),
    },
  ],
}
