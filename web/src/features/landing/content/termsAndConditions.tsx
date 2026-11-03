import { Link } from "react-router"
import { AddressBlock, type LegalDocument } from "../components/LegalPage"

const email = <a href="mailto:hello@cactusmarketing.io">hello@cactusmarketing.io</a>

export const termsAndConditions: LegalDocument = {
  title: "Terms & Conditions",
  effective: "October 24th, 2026",
  related: { to: "/privacy", title: "Privacy Policy" },
  intro: (
    <>
      <p>
        These Terms and Conditions ("Terms") govern your access to and use of Pitchdex, a platform
        operated by Cactus Marketing Inc. By using Pitchdex, you agree to these Terms.
      </p>
      <p>
        <strong>If you do not agree, do not use the platform.</strong>
      </p>
    </>
  ),
  sections: [
    {
      title: "Company Information",
      body: (
        <>
          <p>Pitchdex is operated by:</p>
          <AddressBlock name="Cactus Marketing Inc." />
        </>
      ),
    },
    {
      title: "About Pitchdex",
      body: (
        <p>
          Pitchdex is an outbound email platform designed to help founders identify relevant venture
          capital contacts and manage fundraising outreach.
        </p>
      ),
    },
    {
      title: "Eligibility",
      body: (
        <p>
          You must be at least the age of majority in your jurisdiction to use Pitchdex. By using
          the platform, you confirm that you can legally enter into these Terms.
        </p>
      ),
    },
    {
      title: "Account Registration",
      body: (
        <>
          <p>
            To use certain features, you may need to create an account. You agree to provide
            accurate information and keep your login credentials secure.
          </p>
          <p>You are responsible for all activity under your account.</p>
        </>
      ),
    },
    {
      title: "Acceptable Use",
      body: (
        <>
          <p>You agree not to use Pitchdex:</p>
          <ul>
            <li>for unlawful, fraudulent, deceptive, or misleading activity</li>
            <li>to violate anti-spam, privacy, data protection, or other applicable laws</li>
            <li>to infringe the rights of others</li>
            <li>to interfere with or disrupt the platform</li>
            <li>to attempt unauthorized access to systems, accounts, or data</li>
            <li>to upload malicious code or harmful material</li>
            <li>to misuse contact data or platform data in violation of applicable law</li>
          </ul>
          <p>
            You are solely responsible for the emails you send, the contact data you use, and your
            compliance with all applicable laws and regulations.
          </p>
        </>
      ),
    },
    {
      title: "Email and Outreach Responsibility",
      body: (
        <>
          <p>
            Pitchdex provides tools for outreach and campaign management, but we do not guarantee
            fundraising outcomes, investor responses, meeting bookings, or business results.
          </p>
          <p>
            You are responsible for ensuring that your use of the platform, including any email
            outreach, complies with applicable laws, email rules, privacy laws, and third-party
            platform requirements, including Google requirements where relevant.
          </p>
        </>
      ),
    },
    {
      title: "Integrations and Third-Party Services",
      body: (
        <>
          <p>
            Pitchdex may connect with third-party services such as Google, AWS, and Stripe. Your use
            of third-party services may also be subject to their own terms and policies.
          </p>
          <p>
            We are not responsible for third-party services or for any downtime, errors, or losses
            caused by them.
          </p>
        </>
      ),
    },
    {
      title: "Fees and Billing",
      body: (
        <>
          <p>
            Certain features may require payment or a subscription. By purchasing a paid plan, you
            agree to pay the applicable fees.
          </p>
          <p>Payments are processed through third-party providers such as Stripe.</p>
          <p>
            <strong>30-day money-back guarantee.</strong> If you are not satisfied with Pitchdex,
            you may request a full refund of your first payment within 30 days of your initial
            purchase by contacting {email}. Refunds are issued to the original payment method. After
            this 30-day period, and except as required by applicable law, fees are non-refundable.
          </p>
          <p>
            We may change pricing or subscription features at any time, but changes will apply
            prospectively.
          </p>
        </>
      ),
    },
    {
      title: "Data and Account Retention",
      body: (
        <>
          <p>
            We may retain account and platform data even if your subscription ends, in order to
            preserve your information in case you return to the platform.
          </p>
          <p>
            For details on how we handle your data, please review our{" "}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </>
      ),
    },
    {
      title: "Intellectual Property",
      body: (
        <>
          <p>
            Pitchdex and all related content, software, branding, design, features, and materials
            are owned by or licensed to Cactus Marketing Inc. and are protected by applicable
            intellectual property laws.
          </p>
          <p>
            You may not copy, modify, distribute, reverse engineer, or exploit any part of the
            platform except as permitted by law or with our written permission.
          </p>
        </>
      ),
    },
    {
      title: "User Content",
      body: (
        <>
          <p>
            You retain ownership of the content and data you upload or submit to the platform. By
            using Pitchdex, you grant us a limited right to host, process, transmit, and use that
            content as necessary to operate and improve the service.
          </p>
          <p>
            You represent that you have the rights necessary to use and upload your content and
            data.
          </p>
        </>
      ),
    },
    {
      title: "Service Availability",
      body: (
        <>
          <p>
            We may modify, suspend, or discontinue any part of Pitchdex at any time, with or without
            notice.
          </p>
          <p>We do not guarantee uninterrupted or error-free service.</p>
        </>
      ),
    },
    {
      title: "Disclaimer",
      body: (
        <>
          <p>
            Pitchdex is provided on an "as is" and "as available" basis. To the fullest extent
            permitted by law, we disclaim all warranties, express or implied, including warranties
            of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p>
            We do not guarantee that the platform will meet your requirements or that outreach
            conducted through the platform will produce any specific result.
          </p>
        </>
      ),
    },
    {
      title: "Limitation of Liability",
      body: (
        <>
          <p>
            To the fullest extent permitted by law, Cactus Marketing Inc. and its affiliates,
            officers, employees, and contractors will not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or for any loss of profits, revenue, data,
            business opportunities, or goodwill arising from or related to your use of Pitchdex.
          </p>
          <p>
            To the fullest extent permitted by law, our total liability for any claim relating to
            Pitchdex will not exceed the amount you paid us in the 12 months before the claim arose.
          </p>
        </>
      ),
    },
    {
      title: "Indemnity",
      body: (
        <p>
          You agree to indemnify and hold harmless Cactus Marketing Inc. and its affiliates,
          officers, employees, and contractors from claims, damages, losses, liabilities, and
          expenses arising out of your use of Pitchdex, your content, your outreach activity, or
          your violation of these Terms or applicable law.
        </p>
      ),
    },
    {
      title: "Termination",
      body: (
        <>
          <p>
            We may suspend or terminate your access to Pitchdex at any time if we believe you
            violated these Terms or used the platform in a harmful, unlawful, or risky manner.
          </p>
          <p>You may stop using the platform at any time.</p>
        </>
      ),
    },
    {
      title: "Governing Law",
      body: (
        <p>
          These Terms are governed by the laws of Ontario, Canada, without regard to conflict of law
          principles.
        </p>
      ),
    },
    {
      title: "Changes to These Terms",
      body: (
        <p>
          We may update these Terms from time to time. Continued use of Pitchdex after updated Terms
          are posted means you accept the revised Terms.
        </p>
      ),
    },
    {
      title: "Contact",
      body: (
        <>
          <p>If you have questions about these Terms, contact:</p>
          <AddressBlock name="Cactus Marketing Inc." />
        </>
      ),
    },
  ],
}
