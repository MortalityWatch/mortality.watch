<script setup lang="ts">
const config = useRuntimeConfig()
const supportEmail = config.public.supportEmail
</script>

<template>
  <div class="space-y-6 text-gray-700 dark:text-gray-300">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          1. Overview
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          Mortality Watch accepts optional one-time donations to support infrastructure,
          development, and data access. Donations are voluntary and do not purchase a
          subscription or paid account tier.
        </p>
        <p>
          This policy explains how to contact us if you believe a donation was made in
          error or you need help with a payment issue.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          2. Donation Refunds
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          Donations are generally non-refundable. If a donation was made by mistake,
          was duplicated, or was affected by another payment error, contact us and we
          will review the request.
        </p>
        <p>
          Approved refunds are processed through the original payment processor and
          returned to the original payment method when possible. Processing times may
          vary by bank, card issuer, and payment network.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-2xl font-semibold">
          3. Contact
        </h2>
      </template>
      <div class="space-y-4">
        <p>
          To ask about a donation payment, email us at
          <ULink
            :to="`mailto:${supportEmail}`"
            class="text-primary hover:underline font-semibold"
          >
            {{ supportEmail }}
          </ULink>
          with the subject line "Donation Payment".
        </p>
        <p>
          Include the donation date, amount, payment method, and the email address used
          for the donation so we can locate the transaction.
        </p>
      </div>
    </UCard>
  </div>
</template>
