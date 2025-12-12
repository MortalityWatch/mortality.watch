<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-4 text-center">
        Refund Policy
      </h1>
      <p class="text-center text-gray-600 dark:text-gray-400 mb-8">
        Last Updated: December 12, 2025
      </p>

      <div class="space-y-6 text-gray-700 dark:text-gray-300">
        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              1. Overview
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              At Mortality Watch, we want you to be satisfied with your Pro subscription. This Refund
              Policy explains our refund terms for Pro subscriptions and how to request a refund if
              you are not satisfied with the Service.
            </p>
            <p>
              This Refund Policy should be read in conjunction with our
              <ULink
                to="/legal/terms"
                class="text-primary hover:underline"
              >
                Terms of Service
              </ULink>
              and
              <ULink
                to="/legal/privacy"
                class="text-primary hover:underline"
              >
                Privacy Policy
              </ULink>.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              2. 30-Day Refund Window
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              <strong>2.1 Eligibility:</strong>
            </p>
            <p>
              We offer a 30-day refund window for Pro subscriptions. If you are not satisfied with
              your Pro subscription for any reason, you may request a full refund within 30 days of
              your initial subscription date or renewal date.
            </p>

            <p class="mt-4">
              <strong>2.2 Refund Calculation:</strong>
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Within 30 Days:</strong> Full refund of the subscription fee paid for the current billing period</li>
              <li><strong>After 30 Days:</strong> No refund available (except in cases of billing errors or exceptional circumstances at our discretion)</li>
            </ul>

            <p class="mt-4">
              <strong>2.3 Refund Scope:</strong>
            </p>
            <p>
              Refunds apply only to the current billing period. If you have been subscribed for
              multiple billing periods, we will refund only the most recent charge if it is within
              the 30-day window. Previous billing periods are not eligible for refund.
            </p>

            <p class="mt-4 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 p-4">
              <strong>Example:</strong> If you subscribe on January 1st and request a refund on
              January 25th, you will receive a full refund. If you request a refund on February 5th,
              you will not be eligible for a refund.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              3. How to Request a Refund
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              To request a refund, please follow these steps:
            </p>

            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
              <div>
                <p class="font-semibold mb-2">
                  Step 1: Contact Support
                </p>
                <p>
                  Send an email to
                  <ULink
                    to="mailto:support@mortality.watch"
                    class="text-primary hover:underline font-semibold"
                  >
                    support@mortality.watch
                  </ULink>
                  with the subject line "Refund Request".
                </p>
              </div>

              <div>
                <p class="font-semibold mb-2">
                  Step 2: Include Required Information
                </p>
                <p>
                  In your email, please include:
                </p>
                <ul class="list-disc pl-6 mt-2 space-y-1">
                  <li>Your account email address</li>
                  <li>Your subscription start date (if known)</li>
                  <li>A brief reason for the refund request (optional but helpful)</li>
                </ul>
              </div>

              <div>
                <p class="font-semibold mb-2">
                  Step 3: Wait for Confirmation
                </p>
                <p>
                  We will review your request and respond within 2-3 business days. If your request
                  is approved, we will process the refund immediately.
                </p>
              </div>

              <div>
                <p class="font-semibold mb-2">
                  Step 4: Refund Processing
                </p>
                <p>
                  Approved refunds are processed through Stripe, our payment processor. The refund
                  will be credited to your original payment method within 5-10 business days,
                  depending on your bank or card issuer.
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              4. What Happens After a Refund
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              <strong>4.1 Pro Access:</strong>
            </p>
            <p>
              Once a refund is approved and processed, your Pro subscription will be canceled
              immediately. You will lose access to Pro features, including:
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Saved chart collections</li>
              <li>Advanced analytics and filters</li>
              <li>Export and download capabilities</li>
              <li>Any other Pro-exclusive features</li>
            </ul>

            <p class="mt-4">
              <strong>4.2 Your Saved Data:</strong>
            </p>
            <p>
              After a refund, your account will revert to a free account. Your basic account data
              (email, username) will be retained, but:
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Saved Charts:</strong> Charts saved during your Pro subscription will be retained but may be limited in number or functionality based on free tier limits</li>
              <li><strong>Chart Collections:</strong> Any chart collections created as a Pro user will be inaccessible but not deleted for 30 days, in case you choose to re-subscribe</li>
              <li><strong>Data Export:</strong> You will no longer be able to export data, but you may contact us to request a one-time export of your saved charts within 14 days of the refund</li>
            </ul>

            <p class="mt-4">
              <strong>4.3 Re-Subscription:</strong>
            </p>
            <p>
              You may re-subscribe to Pro at any time after receiving a refund. However, if you
              request multiple refunds within a short period, we reserve the right to decline future
              subscriptions or refund requests at our discretion.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              5. Exceptions and Special Cases
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              <strong>5.1 Billing Errors:</strong>
            </p>
            <p>
              If you were charged due to a billing error (e.g., duplicate charge, incorrect amount),
              we will issue a full refund regardless of the 30-day window. Please contact us at
              <ULink
                to="mailto:support@mortality.watch"
                class="text-primary hover:underline"
              >
                support@mortality.watch
              </ULink>
              immediately if you notice a billing error.
            </p>

            <p class="mt-4">
              <strong>5.2 Service Downtime:</strong>
            </p>
            <p>
              If the Service experiences significant downtime or technical issues that prevent you
              from using Pro features for an extended period, you may be eligible for a prorated
              refund or credit, even outside the 30-day window. Please contact us to discuss your
              situation.
            </p>

            <p class="mt-4">
              <strong>5.3 Account Termination:</strong>
            </p>
            <p>
              If we terminate your account for violation of our Terms of Service, you will not be
              eligible for a refund. However, if we discontinue the Pro subscription service entirely,
              we will provide prorated refunds to all active subscribers.
            </p>

            <p class="mt-4">
              <strong>5.4 Charitable Donations:</strong>
            </p>
            <p>
              If you made a one-time donation to Mortality Watch (as opposed to a Pro subscription),
              donations are generally non-refundable. However, if you believe a donation was made in
              error, please contact us to discuss your situation.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              6. Cancellation Without Refund
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              If you do not wish to receive a refund but simply want to cancel your Pro subscription,
              you can do so at any time through your account settings:
            </p>

            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <ol class="list-decimal pl-6 space-y-2">
                <li>Log in to your account</li>
                <li>Go to Profile → Subscription Settings</li>
                <li>Click "Cancel Subscription"</li>
              </ol>
              <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Your cancellation will take effect at the end of your current billing period. You
                will continue to have Pro access until the end of the period you have already paid for.
                No refund will be issued for cancellations without a refund request.
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              7. Refund Processing Time
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              Once a refund is approved:
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Processing by Mortality Watch:</strong> Immediate (same business day)</li>
              <li><strong>Processing by Stripe:</strong> 5-10 business days to appear on your statement</li>
              <li><strong>Total Time:</strong> Typically 5-10 business days from approval</li>
            </ul>
            <p class="mt-4">
              If you do not see the refund on your statement after 10 business days, please check with
              your bank or card issuer, as processing times may vary. If the issue persists, contact
              us at
              <ULink
                to="mailto:support@mortality.watch"
                class="text-primary hover:underline"
              >
                support@mortality.watch
              </ULink>.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              8. Currency and Exchange Rates
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              Refunds will be issued in the same currency as the original payment. If your bank or
              card issuer applies currency conversion fees or exchange rate differences, we are not
              responsible for any discrepancies between the original charge and the refunded amount.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              9. Changes to This Refund Policy
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              We may update this Refund Policy from time to time. If we make material changes, we will
              notify you by email or by posting a notice on the Service prior to the effective date of
              the changes.
            </p>
            <p>
              Changes to this Refund Policy will not affect refund requests submitted before the
              effective date of the changes.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-2xl font-semibold">
              10. Contact Information
            </h2>
          </template>
          <div class="space-y-4">
            <p>
              If you have any questions about this Refund Policy or wish to request a refund, please
              contact us:
            </p>
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <p class="font-semibold mb-2">
                Email:
              </p>
              <p>
                <ULink
                  to="mailto:support@mortality.watch"
                  class="text-primary hover:underline text-lg font-semibold"
                >
                  support@mortality.watch
                </ULink>
              </p>
              <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Please use the subject line "Refund Request" for fastest processing.
              </p>
            </div>
          </div>
        </UCard>

        <div class="mt-8 p-6 bg-green-50 dark:bg-green-950 border-l-4 border-green-500 rounded-lg">
          <h3 class="font-semibold text-lg mb-2">
            Our Commitment to You
          </h3>
          <p>
            We are committed to providing a valuable and reliable service. If you encounter any issues
            with your Pro subscription or the Service, please reach out to us before requesting a refund.
            We may be able to resolve your concerns and ensure you get the most value from Mortality Watch.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page metadata
definePageMeta({
  title: 'Refund Policy'
})

// SEO metadata
useSeoMeta({
  title: 'Refund Policy - Mortality Watch',
  description: 'Refund Policy for Mortality Watch Pro subscriptions. Learn about our 30-day refund window and how to request a refund.',
  ogTitle: 'Refund Policy - Mortality Watch',
  ogDescription: 'Our 30-day refund policy for Pro subscriptions and how to request a refund.',
  ogImage: '/og-image.png',
  twitterTitle: 'Refund Policy - Mortality Watch',
  twitterDescription: '30-day refund policy for Pro subscriptions.',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
