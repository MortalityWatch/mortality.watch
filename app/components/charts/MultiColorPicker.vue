<script lang="ts" setup>
import { ref, watch } from 'vue'

const props = defineProps<{ colors: string[] }>()
const emit = defineEmits(['colorsChanged'])

// Local copy of colors to allow v-model binding
const localColors = ref<string[]>([...props.colors])

// Watch props to sync external changes
watch(() => props.colors, (newColors) => {
  localColors.value = [...newColors]
}, { deep: true })

const handleColorUpdate = (index: number, value: string) => {
  localColors.value[index] = value
  emit('colorsChanged', [...localColors.value])
}

const reset = () => emit('colorsChanged', undefined)
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <div
      v-for="(color, index) of localColors"
      :key="index"
      class="relative"
    >
      <input
        :value="color"
        type="color"
        class="color-picker"
        :aria-label="`Color ${index + 1}`"
        @input="handleColorUpdate(index, ($event.target as HTMLInputElement).value)"
      >
    </div>
    <UButton
      icon="i-lucide-rotate-ccw"
      size="sm"
      color="neutral"
      variant="ghost"
      @click="reset"
    >
      Reset
    </UButton>
  </div>
</template>

<style scoped>
.color-picker {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgb(209 213 219);
  overflow: hidden;
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.dark .color-picker {
  border-color: rgb(75 85 99);
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 50%;
}

.color-picker::-moz-color-swatch {
  border: none;
  border-radius: 50%;
}
</style>
