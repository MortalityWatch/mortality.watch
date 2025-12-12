<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-4 text-center">
        Terms of Service
      </h1>
      <p class="text-center text-gray-600 dark:text-gray-400 mb-8">
        Last Updated: December 12, 2025
      </p>

      <div class="space-y-6 text-gray-700 dark:text-gray-300">
        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              1. Acceptance of Terms
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              Welcome to Mortality Watch. By accessing or using our website and services at
              <ULink
                :to="siteUrl"
                target="_blank"
                class="text-primary hover:underline"
              >
                {{ siteDomain }}
              </ULink>
              (the "Service"), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree to these Terms, please do not use the Service.
            </p>
            <p>
              Mortality Watch ("we," "us," or "our") provides a data visualization platform for
              analyzing global mortality statistics. These Terms govern your use of the Service,
              whether as a free user or as a subscriber to our Pro plan.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              2. Description of Service
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              Mortality Watch is a web-based platform that provides:
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Interactive mortality data visualizations and charts</li>
              <li>Access to global mortality statistics from official sources</li>
              <li>Tools for exploring and analyzing mortality trends</li>
              <li>Data export capabilities and chart saving features</li>
              <li>Premium features for Pro subscribers (chart collections, advanced analytics, etc.)</li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of the Service
              at any time, with or without notice. We will not be liable to you or any third party
              for any modification, suspension, or discontinuation of the Service.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              3. User Accounts
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              <strong>3.1 Account Creation:</strong> To access certain features of the Service,
              including saving charts and subscribing to Pro, you must create an account. You agree
              to provide accurate, current, and complete information during registration and to update
              such information to keep it accurate, current, and complete.
            </p>
            <p>
              <strong>3.2 Account Security:</strong> You are responsible for maintaining the
              confidentiality of your account credentials and for all activities that occur under
              your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            <p>
              <strong>3.3 Account Termination:</strong> We reserve the right to suspend or terminate
              your account at any time for any reason, including if we believe you have violated these
              Terms. You may terminate your account at any time through your profile settings.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              4. Pro Subscription Terms
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              <strong>4.1 Subscription Plans:</strong> Mortality Watch offers a Pro subscription
              plan that provides access to premium features. Subscription pricing and features are
              described on our Features page.
            </p>
            <p>
              <strong>4.2 Payment:</strong> By subscribing to Pro, you agree to pay all applicable
              subscription fees. We use Stripe for payment processing. Your payment information is
              processed securely by Stripe and is not stored on our servers.
            </p>
            <p>
              <strong>4.3 Billing Cycle:</strong> Pro subscriptions are billed on a recurring basis
              (monthly or annual, depending on your selected plan). You will be charged automatically
              at the beginning of each billing cycle unless you cancel your subscription.
            </p>
            <p>
              <strong>4.4 Cancellation:</strong> You may cancel your Pro subscription at any time
              through your profile settings. Cancellation will take effect at the end of your current
              billing period. No refunds will be issued for partial billing periods, except as described
              in our Refund Policy.
            </p>
            <p>
              <strong>4.5 Price Changes:</strong> We reserve the right to change subscription pricing.
              We will provide at least 30 days' notice of any price increases. If you do not agree to
              the new pricing, you may cancel your subscription.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              5. User Conduct
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              You agree not to:
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
              <li>Use any automated means (bots, scrapers, etc.) to access the Service without our written permission</li>
              <li>Reproduce, duplicate, copy, sell, or resell any portion of the Service without our written permission</li>
              <li>Upload or transmit viruses, malware, or any other malicious code</li>
              <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with any person or entity</li>
              <li>Collect or harvest any personally identifiable information from the Service</li>
              <li>Use the Service to spam, harass, or harm others</li>
            </ul>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              6. Intellectual Property
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              <strong>6.1 Our Property:</strong> The Service and its original content (excluding user
              data and open-source components), features, and functionality are owned by Mortality Watch
              and are protected by international copyright, trademark, patent, trade secret, and other
              intellectual property laws.
            </p>
            <p>
              <strong>6.2 Open Source:</strong> Mortality Watch's codebase is open source and available
              under the licenses specified in our GitHub repositories. The use of our open-source code
              is governed by those respective licenses.
            </p>
            <p>
              <strong>6.3 Mortality Data:</strong> The mortality data provided through the Service is
              aggregated from official government sources and international organizations. Such data is
              typically in the public domain or available under open data licenses. We do not claim
              ownership of the underlying mortality statistics.
            </p>
            <p>
              <strong>6.4 Your Content:</strong> You retain ownership of any charts, analyses, or other
              content you create using the Service. By using the Service, you grant us a limited,
              non-exclusive license to store and display your saved charts as necessary to provide the
              Service to you.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              7. Data Accuracy and Disclaimer
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              <strong>7.1 No Warranty:</strong> While we strive to provide accurate and up-to-date
              mortality data, we make no warranties or representations about the accuracy, completeness,
              or reliability of the data or visualizations provided through the Service.
            </p>
            <p>
              <strong>7.2 Not Medical or Public Health Advice:</strong> The Service is for informational
              and educational purposes only. The data, visualizations, and analyses provided through the
              Service should not be used as a substitute for professional medical or public health advice,
              diagnosis, or treatment.
            </p>
            <p>
              <strong>7.3 Use at Your Own Risk:</strong> You acknowledge that any reliance on data or
              information provided through the Service is at your own risk. We are not liable for any
              decisions or actions you take based on information from the Service.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              8. Limitation of Liability
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MORTALITY WATCH AND ITS AFFILIATES, OFFICERS,
              EMPLOYEES, AGENTS, PARTNERS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION,
              LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
            <p>
              IN NO EVENT SHALL OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE EXCEED
              THE GREATER OF $100 USD OR THE AMOUNT YOU PAID US IN THE PAST TWELVE MONTHS FOR THE
              SERVICE.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              9. Indemnification
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              You agree to indemnify, defend, and hold harmless Mortality Watch and its affiliates,
              officers, directors, employees, agents, licensors, and suppliers from and against all
              losses, expenses, damages, costs, claims, and demands, including reasonable attorneys'
              fees, resulting from your use of the Service, your violation of these Terms, or your
              violation of any rights of another party.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              10. Privacy
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              Your use of the Service is also governed by our
              <ULink
                to="/legal/privacy"
                class="text-primary hover:underline"
              >
                Privacy Policy
              </ULink>, which describes how we collect, use, and protect your personal information.
              By using the Service, you consent to the practices described in the Privacy Policy.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              11. Third-Party Services
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              The Service may contain links to third-party websites or services (such as data sources,
              GitHub, social media platforms, payment processors) that are not owned or controlled by
              Mortality Watch. We have no control over and assume no responsibility for the content,
              privacy policies, or practices of any third-party websites or services.
            </p>
            <p>
              You acknowledge and agree that we shall not be responsible or liable for any damage or
              loss caused by your use of any third-party content, goods, or services available through
              the Service.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              12. Changes to Terms
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              We reserve the right to modify these Terms at any time. If we make material changes,
              we will notify you by email (if you have provided an email address) or by posting a
              notice on the Service prior to the effective date of the changes.
            </p>
            <p>
              Your continued use of the Service after the effective date of any changes constitutes
              your acceptance of the revised Terms. If you do not agree to the revised Terms, you
              must stop using the Service.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              13. Governing Law and Dispute Resolution
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              <strong>13.1 Governing Law:</strong> These Terms shall be governed by and construed in
              accordance with the laws of the jurisdiction in which Mortality Watch operates, without
              regard to its conflict of law provisions.
            </p>
            <p>
              <strong>13.2 Dispute Resolution:</strong> Any dispute arising from these Terms or your
              use of the Service shall be resolved through binding arbitration, except that either
              party may seek injunctive or other equitable relief in any court of competent jurisdiction
              to prevent infringement of intellectual property rights.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              14. General Provisions
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              <strong>14.1 Entire Agreement:</strong> These Terms, together with our Privacy Policy
              and Refund Policy, constitute the entire agreement between you and Mortality Watch
              regarding the Service.
            </p>
            <p>
              <strong>14.2 Severability:</strong> If any provision of these Terms is found to be
              invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>
            <p>
              <strong>14.3 Waiver:</strong> No waiver of any term of these Terms shall be deemed a
              further or continuing waiver of such term or any other term.
            </p>
            <p>
              <strong>14.4 Assignment:</strong> You may not assign or transfer these Terms or your
              rights under these Terms without our prior written consent. We may assign these Terms
              without restriction.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              15. Contact Information
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              If you have any questions about these Terms, please contact us at:
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
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl || 'https://www.mortality.watch'
const siteDomain = siteUrl.replace(/^https?:\/\//, '')

// Page metadata
definePageMeta({
  title: 'Terms of Service'
})

// SEO metadata
useSeoMeta({
  title: 'Terms of Service - Mortality Watch',
  description: 'Terms of Service for Mortality Watch, a data visualization platform for analyzing global mortality statistics.',
  ogTitle: 'Terms of Service - Mortality Watch',
  ogDescription: 'Terms governing the use of Mortality Watch services and subscription plans.',
  ogImage: '/og-image.png',
  twitterTitle: 'Terms of Service - Mortality Watch',
  twitterDescription: 'Terms governing the use of Mortality Watch services.',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
