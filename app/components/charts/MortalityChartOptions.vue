<script setup lang="ts">
import type { MyRouter } from '@/model/router'
import { openNewWindowWithBase64Url } from '@/utils'
import { showToast } from '../../toast'
import { inject, ref } from 'vue'
import SpeedDial from 'primevue/speeddial'
import {
  compress,
  arrayBufferToBase64
} from '@/lib/compression/compress.browser'

const router = inject<MyRouter>('router')!

// SpeedDial items
const speedDialItems = ref([
  {
    label: 'Copy Link',
    icon: 'pi pi-link',
    command: () => copyToClipboard()
  },
  {
    label: 'Screenshot',
    icon: 'pi pi-camera',
    command: () => saveImage()
  },
  {
    label: 'Save',
    icon: 'pi pi-save',
    command: () => getImage()
  }
])

// Methods
const saveImage = () => {
  const canvas = document.querySelector(
    '#chartContainer > canvas'
  ) as HTMLCanvasElement
  const dataURL = canvas.toDataURL('image/png')
  openNewWindowWithBase64Url(dataURL)
}

const makeUrl = async () => {
  const base = 'https://mortality.watch/?qr='
  const query = JSON.stringify(window.location)
  const encodedQuery = arrayBufferToBase64(await compress(query))
  return base + encodeURIComponent(encodedQuery)
}

const getImage = async () => {
  const url = await makeUrl()
  window.open(url.replaceAll('/?qr', '/chart?qr'), '_blank')
}

const copyToClipboard = async () => {
  await router.update()
  navigator.clipboard.writeText(window.location.href).then(
    () => showToast('Link copied to clipboard!'),
    () => showToast('Copy failed!')
  )
}
</script>

<template>
  <SpeedDial
    :model="speedDialItems"
    direction="up"
    :style="{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 1000 }"
    button-class="p-button-sm p-button-rounded"
    show-icon="pi pi-bars"
    hide-icon="pi pi-times"
    :tooltip-options="{ position: 'left', event: 'hover' }"
  />
</template>
