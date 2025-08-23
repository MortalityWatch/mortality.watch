<script lang="ts" setup>
import { computed, toRaw } from 'vue'

const props = defineProps<{ colors: string[] }>()
const colors = computed(() => props.colors)
const emit = defineEmits(['colorsChanged'])
const handleColorUpdate = () => emit('colorsChanged', toRaw(colors.value))
const reset = () => emit('colorsChanged', undefined)
</script>

<template>
  <span
    v-for="(_, index) of colors"
    :key="index"
  >
    <color-picker
      v-model:pure-color="colors[index]"
      format="hex"
      shape="circle"
      @update:pure-color="handleColorUpdate()"
    />
  </span>
  <button
    class="chartButton"
    @click="reset"
  >
    ↻&nbsp;&nbsp;Reset
  </button>
</template>

<style scoped>
.chartButton {
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  font-size: 9pt !important;
  padding: 0px;
}
</style>
