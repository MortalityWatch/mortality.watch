<script setup lang="ts">
const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl || 'https://www.mortality.watch'
const siteDomain = siteUrl.replace(/^https?:\/\//, '')
</script>

<template>
  <div class="space-y-6 text-gray-700 dark:text-gray-300">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          1. Introduction
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          Mortality Watch ("we," "us," or "our") is committed to protecting your privacy. This
          Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you use our website and services at
          <ULink
            :to="siteUrl"
            target="_blank"
            class="text-primary hover:underline"
          >
            {{ siteDomain }}
          </ULink>
          (the "Service").
        </p>
        <p>
          By using the Service, you consent to the data practices described in this Privacy Policy.
          If you do not agree with this Privacy Policy, please do not use the Service.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          2. Information We Collect
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          <strong>2.1 Personal Information You Provide:</strong>
        </p>
        <p>
          When you create an account or use certain features of the Service, we may collect:
        </p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Account Information:</strong> Email address, username, and password (encrypted)</li>
          <li><strong>Profile Information:</strong> Optional profile details you choose to provide</li>
          <li><strong>Saved Charts:</strong> Charts and visualizations you create and save to your account</li>
          <li><strong>Payment Information:</strong> When you subscribe to Pro, payment information is collected and processed by Stripe (see Section 4)</li>
        </ul>

        <p class="mt-4">
          <strong>2.2 Information Automatically Collected:</strong>
        </p>
        <p>
          When you use the Service, we automatically collect certain information:
        </p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Usage Data:</strong> Pages visited, features used, time spent on pages, charts created</li>
          <li><strong>Device Information:</strong> Browser type, operating system, device type, IP address</li>
          <li><strong>Cookies:</strong> Small data files stored on your device (see Section 8)</li>
        </ul>

        <p class="mt-4">
          <strong>2.3 Information from Third Parties:</strong>
        </p>
        <p>
          We do not purchase or receive personal information about you from third-party data brokers.
          However, if you log in using a third-party authentication service (if offered), we may
          receive basic profile information from that service.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          3. How We Use Your Information
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          We use the information we collect to:
        </p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Provide the Service:</strong> Create and manage your account, save and retrieve your charts, process subscriptions</li>
          <li><strong>Improve the Service:</strong> Analyze usage patterns, identify bugs, develop new features</li>
          <li><strong>Communicate with You:</strong> Send account-related emails (verification, password resets), respond to support requests, send service announcements</li>
          <li><strong>Process Payments:</strong> Handle Pro subscriptions and refunds via Stripe</li>
          <li><strong>Security and Fraud Prevention:</strong> Protect against unauthorized access, abuse, and fraud</li>
          <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our Terms of Service</li>
          <li><strong>Marketing:</strong> With your consent, send newsletters or promotional materials (you may opt out at any time)</li>
        </ul>
        <p class="mt-4">
          We will not sell, rent, or share your personal information with third parties for their
          own marketing purposes without your explicit consent.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          4. Third-Party Services
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          We use the following third-party services that may collect or process your information:
        </p>

        <p class="mt-4">
          <strong>4.1 Stripe (Payment Processing):</strong>
        </p>
        <p>
          When you subscribe to Pro, your payment information (credit card details) is collected
          and processed by
          <ULink
            to="https://stripe.com"
            target="_blank"
            class="text-primary hover:underline"
          >
            Stripe
          </ULink>, our payment processor. We do not store your full credit card information on
          our servers. Stripe's privacy policy is available at
          <ULink
            to="https://stripe.com/privacy"
            target="_blank"
            class="text-primary hover:underline"
          >
            https://stripe.com/privacy
          </ULink>.
        </p>

        <p class="mt-4">
          <strong>4.2 Resend (Email Delivery):</strong>
        </p>
        <p>
          We use
          <ULink
            to="https://resend.com"
            target="_blank"
            class="text-primary hover:underline"
          >
            Resend
          </ULink>
          to send transactional emails (account verification, password resets, subscription
          notifications). Resend processes your email address for this purpose. Resend's privacy
          policy is available at
          <ULink
            to="https://resend.com/legal/privacy-policy"
            target="_blank"
            class="text-primary hover:underline"
          >
            https://resend.com/legal/privacy-policy
          </ULink>.
        </p>

        <p class="mt-4">
          <strong>4.3 Sentry (Error Tracking):</strong>
        </p>
        <p>
          We use
          <ULink
            to="https://sentry.io"
            target="_blank"
            class="text-primary hover:underline"
          >
            Sentry
          </ULink>
          for error tracking and debugging. When errors occur, Sentry may collect technical
          information about the error, including stack traces and request details. Personal
          information is minimized in error reports. Sentry's privacy policy is available at
          <ULink
            to="https://sentry.io/privacy"
            target="_blank"
            class="text-primary hover:underline"
          >
            https://sentry.io/privacy
          </ULink>.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          5. Data Retention
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          We retain your personal information for as long as necessary to provide the Service
          and fulfill the purposes described in this Privacy Policy, unless a longer retention
          period is required or permitted by law.
        </p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Account Data:</strong> Retained while your account is active. If you delete your account, we will delete your personal information within 30 days, except as required for legal or security purposes.</li>
          <li><strong>Saved Charts:</strong> Retained while your account is active. Deleted when you delete your account or individual charts.</li>
          <li><strong>Payment Records:</strong> Retained for tax and accounting purposes as required by law (typically 7 years).</li>
          <li><strong>Server Logs:</strong> Server logs are retained for up to 30 days for debugging and security purposes.</li>
        </ul>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          6. Your Rights (GDPR/CCPA)
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          If you are a resident of the European Union (EU), European Economic Area (EEA), or
          California, you have certain rights regarding your personal information:
        </p>

        <p class="mt-4">
          <strong>6.1 Rights Under GDPR (EU/EEA Residents):</strong>
        </p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you</li>
          <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete information</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your personal information ("right to be forgotten")</li>
          <li><strong>Right to Restriction:</strong> Request that we limit how we use your information</li>
          <li><strong>Right to Data Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
          <li><strong>Right to Object:</strong> Object to our processing of your information</li>
          <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for processing based on consent</li>
        </ul>

        <p class="mt-4">
          <strong>6.2 Rights Under CCPA (California Residents):</strong>
        </p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Right to Know:</strong> Request information about the personal information we collect, use, and disclose</li>
          <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
          <li><strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (Note: We do not sell personal information)</li>
          <li><strong>Right to Non-Discrimination:</strong> Not be discriminated against for exercising your privacy rights</li>
        </ul>

        <p class="mt-4">
          <strong>6.3 How to Exercise Your Rights:</strong>
        </p>
        <p>
          To exercise any of these rights, please contact us at
          <ULink
            to="mailto:support@mortality.watch"
            class="text-primary hover:underline"
          >
            support@mortality.watch
          </ULink>. We will respond to your request within 30 days (or as required by applicable law).
        </p>
        <p>
          You may also manage some of your information directly through your account settings,
          including updating your profile and deleting saved charts.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          7. Data Security
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          We implement reasonable security measures to protect your personal information from
          unauthorized access, disclosure, alteration, or destruction. These measures include:
        </p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Encryption of data in transit (HTTPS/TLS)</li>
          <li>Secure password storage using industry-standard hashing (bcrypt)</li>
          <li>Access controls and authentication requirements</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Use of trusted third-party services with strong security practices</li>
        </ul>
        <p class="mt-4">
          However, no method of transmission over the internet or electronic storage is 100% secure.
          While we strive to protect your personal information, we cannot guarantee its absolute security.
          You are responsible for maintaining the confidentiality of your account credentials.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          8. Cookies and Tracking Technologies
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          We use cookies and similar tracking technologies to enhance your experience on the Service:
        </p>

        <p class="mt-4">
          <strong>8.1 Essential Cookies:</strong>
        </p>
        <p>
          These cookies are necessary for the Service to function properly. They enable core
          functionality such as user authentication, session management, and security features.
          You cannot opt out of essential cookies.
        </p>

        <p class="mt-4">
          <strong>8.2 Functional Cookies:</strong>
        </p>
        <p>
          These cookies remember your preferences and settings (e.g., theme selection, saved chart
          filters). Disabling functional cookies may limit some features of the Service.
        </p>

        <p class="mt-4">
          <strong>8.3 Analytics:</strong>
        </p>
        <p>
          We do not use third-party analytics services that track personally identifiable
          information. Any usage data collected is aggregated and anonymized.
        </p>

        <p class="mt-4">
          <strong>8.4 Managing Cookies:</strong>
        </p>
        <p>
          You can manage cookie preferences through your browser settings. Most browsers allow you
          to block or delete cookies. However, disabling cookies may affect your ability to use
          certain features of the Service.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          9. International Data Transfers
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          Your information may be transferred to and processed in countries other than your country
          of residence. These countries may have data protection laws that are different from the
          laws of your country.
        </p>
        <p>
          If you are located in the EU/EEA, we ensure that any international data transfers comply
          with GDPR requirements, including the use of Standard Contractual Clauses or other
          approved transfer mechanisms.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          10. Children's Privacy
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          The Service is not directed to children under the age of 13 (or 16 in the EU/EEA). We do
          not knowingly collect personal information from children. If you believe we have collected
          information from a child, please contact us at
          <ULink
            to="mailto:support@mortality.watch"
            class="text-primary hover:underline"
          >
            support@mortality.watch
          </ULink>, and we will promptly delete such information.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          11. Changes to This Privacy Policy
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices,
          technology, legal requirements, or other factors. We will notify you of any material
          changes by:
        </p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Posting the updated Privacy Policy on this page with a new "Last Updated" date</li>
          <li>Sending an email notification to the email address associated with your account (for material changes)</li>
        </ul>
        <p class="mt-4">
          Your continued use of the Service after the effective date of any changes constitutes
          your acceptance of the revised Privacy Policy.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          12. Contact Us
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our
          data practices, please contact us at:
        </p>
        <p class="font-semibold">
          Email:
          <ULink
            to="mailto:support@mortality.watch"
            class="text-primary hover:underline"
          >
            support@mortality.watch
          </ULink>
        </p>
        <p class="mt-4">
          If you are located in the EU/EEA and are not satisfied with our response, you have the
          right to lodge a complaint with your local data protection authority.
        </p>
      </div>
    </UCard>
  </div>
</template>
