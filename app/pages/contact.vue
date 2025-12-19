<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <PageHeader
        title="Contact Us"
        max-width="none"
      >
        <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Have a question, suggestion, or found a bug? We'd love to hear from you.
        </p>
      </PageHeader>

      <!-- Success Message -->
      <UCard
        v-if="showSuccess"
        class="mb-6"
      >
        <div class="flex items-start gap-3">
          <Icon
            name="i-lucide-check-circle"
            class="w-6 h-6 text-green-500 shrink-0 mt-0.5"
          />
          <div>
            <h3 class="text-lg font-semibold mb-1">
              Message Sent Successfully!
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Thank you for contacting us. We'll get back to you as soon as possible.
            </p>
            <UButton
              variant="outline"
              size="sm"
              class="mt-3"
              @click="resetForm"
            >
              Send Another Message
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Contact Form -->
      <UCard v-if="!showSuccess">
        <UForm
          :schema="contactSchema"
          :state="formState"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField
            label="Name"
            name="name"
            required
            class="w-full"
          >
            <UInput
              v-model="formState.name"
              class="w-full"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UFormField
            label="Email"
            name="email"
            required
            class="w-full"
          >
            <UInput
              v-model="formState.email"
              type="email"
              class="w-full"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UFormField
            label="Subject"
            name="subject"
            required
            class="w-full"
          >
            <UInput
              v-model="formState.subject"
              class="w-full"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UFormField
            label="Message"
            name="message"
            required
            class="w-full"
          >
            <UTextarea
              v-model="formState.message"
              class="w-full"
              :rows="6"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UFormField
            v-if="currentChartUrl"
            name="includeChartUrl"
          >
            <UCheckbox
              v-model="formState.includeChartUrl"
              :label="`Include current chart URL (${currentPageName})`"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            :title="errorMessage"
            icon="i-lucide-alert-circle"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link' }"
            @close="errorMessage = ''"
          />

          <UButton
            type="submit"
            block
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            Send Message
          </UButton>
        </UForm>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'

// Form validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
  includeChartUrl: z.boolean().optional()
})

type ContactFormData = z.infer<typeof contactSchema>

// Form state
const formState = reactive<ContactFormData>({
  name: '',
  email: '',
  subject: '',
  message: '',
  includeChartUrl: false
})

// Component state
const isSubmitting = ref(false)
const showSuccess = ref(false)
const errorMessage = ref('')
const toast = useToast()
const route = useRoute()
const { withRetry, handleError } = useErrorRecovery()

// Determine if user is on a page with chart data
const currentChartUrl = computed(() => {
  const path = route.path
  if (path.startsWith('/explorer') || path.startsWith('/ranking')) {
    return `${window.location.origin}${route.fullPath}`
  }
  return null
})

const currentPageName = computed(() => {
  const path = route.path
  if (path.startsWith('/explorer')) {
    return 'Explorer'
  }
  if (path.startsWith('/ranking')) {
    return 'Ranking'
  }
  return ''
})

// Submit handler
async function onSubmit(): Promise<void> {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    // Prepare payload
    const payload: ContactFormData & { chartUrl?: string } = {
      name: formState.name,
      email: formState.email,
      subject: formState.subject,
      message: formState.message
    }

    // Add chart URL if checkbox is checked
    if (formState.includeChartUrl && currentChartUrl.value) {
      payload.chartUrl = currentChartUrl.value
    }

    // Send to API with automatic retry for transient failures
    await withRetry(() => $fetch('/api/contact', {
      method: 'POST',
      body: payload
    }), {
      maxRetries: 3,
      exponentialBackoff: true,
      context: 'contactForm',
      onlyRetryableErrors: true
    })

    // Show success state
    showSuccess.value = true

    // Show toast notification
    toast.add({
      title: 'Message sent!',
      description: 'We\'ll get back to you soon.',
      color: 'success'
    })
  } catch (err: unknown) {
    errorMessage.value = 'Failed to send message. Please try again later.'
    handleError(err, errorMessage.value, 'contactForm')
  } finally {
    isSubmitting.value = false
  }
}

// Reset form
function resetForm(): void {
  formState.name = ''
  formState.email = ''
  formState.subject = ''
  formState.message = ''
  formState.includeChartUrl = false
  showSuccess.value = false
  errorMessage.value = ''
}

// Page metadata
definePageMeta({
  title: 'Contact'
})

// SEO metadata
useSeoMeta({
  title: 'Contact Us',
  description: 'Get in touch with the Mortality Watch team. We\'re here to help with questions, suggestions, and bug reports.',
  ogTitle: 'Contact Mortality Watch',
  ogDescription: 'Get in touch with the Mortality Watch team for support and inquiries.',
  ogImage: '/og-image.png'
})
</script>
