<script setup lang="ts">
import { openNewWindowWithBase64Url } from '@/utils'
import { showToast } from '../../toast'
import { ref } from 'vue'
import {
  compress,
  arrayBufferToBase64
} from '@/lib/compression/compress.browser'

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

const makeUrl = async () => {
  const base = 'https://mortality.watch/?qr='
  const query = JSON.stringify(window.location)
  const encodedQuery = arrayBufferToBase64(await compress(query))
  return base + encodeURIComponent(encodedQuery)
}

const getImage = async () => {
  const url = await makeUrl()
  window.open(url.replaceAll('/?qr', '/chart.png?qr'), '_blank')
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
    <UDropdown
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
    </UDropdown>
  </div>
</template>
