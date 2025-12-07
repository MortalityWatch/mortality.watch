<script setup lang="ts">
import { openNewWindowWithBase64Url } from '@/utils'
import { showToast } from '../../toast'
import { ref } from 'vue'

const isOpen = ref(false)

const menuItems = [
  [
    {
      label: 'Copy Link',
      icon: 'i-lucide-link',
      click: () => copyToClipboard()
    },
    {
      label: 'Screenshot',
      icon: 'i-lucide-camera',
      click: () => saveImage()
    },
    {
      label: 'Save',
      icon: 'i-lucide-save',
      click: () => getImage()
    }
  ]
]

const saveImage = () => {
  const canvas = document.querySelector(
    '#chartContainer > canvas'
  ) as HTMLCanvasElement
  const dataURL = canvas.toDataURL('image/png')
  openNewWindowWithBase64Url(dataURL)
  isOpen.value = false
}

const getImage = () => {
  // Use the current URL's query params directly for the chart.png endpoint
  const chartUrl = window.location.href.replace('/explorer', '/chart.png')
  window.open(chartUrl, '_blank')
  isOpen.value = false
}

const copyToClipboard = async () => {
  navigator.clipboard.writeText(window.location.href).then(
    () => showToast('Link copied to clipboard!'),
    () => showToast('Copy failed!')
  )
  isOpen.value = false
}
</script>

<template>
  <div
    class="fixed bottom-4 right-4"
    style="z-index: 9999;"
  >
    <UDropdownMenu
      v-model:open="isOpen"
      :items="menuItems"
      :popper="{ placement: 'top-end' }"
    >
      <UButton
        icon="i-lucide-menu"
        size="lg"
        color="primary"
        variant="solid"
        class="rounded-full"
        aria-label="Chart options"
      />
    </UDropdownMenu>
  </div>
</template>
