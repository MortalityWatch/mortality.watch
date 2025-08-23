<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  sliderValue: string[]
  labels: string[]
  color: string
  minRange: number
}>()
const emit = defineEmits(['sliderChanged'])

const makeMarks = (labels: string[]) => {
  if (labels.length <= 7) return labels
  const len = labels.length
  const indices = [
    0,
    Math.ceil(len / 4),
    Math.ceil(len / 4) * 2,
    Math.ceil(len / 4) * 3,
    len - 1
  ]
  return indices.reduce(
    (marks, idx) => ({ ...marks, [labels[idx]]: { label: labels[idx] } }),
    {} as Record<string, Record<string, string>>
  )
}

const showMergeTooltip = computed(() => {
  const fromIdx = props.labels.indexOf(sliderValueLocal.value[0])
  const toIdx = props.labels.indexOf(sliderValueLocal.value[1])
  return (toIdx - fromIdx) / props.labels.length < 0.2
})

const sliderValueLocal = computed({
  get: () => props.sliderValue,
  set: (val: string[]) => emit('sliderChanged', val)
})
</script>

<template>
  <vue-slider
    :style="{
      '--slider-main-color': props.color,
      '--slider-tooltip-color': props.color
    }"
    class="w-full"
    v-model="sliderValueLocal"
    :data="labels"
    :min="0"
    :max="labels.length - 1"
    :marks="makeMarks(labels)"
    :enable-cross="false"
    :adsorb="true"
    :min-range="minRange"
    :tooltip="showMergeTooltip ? 'none' : 'always'"
  >
    <template v-slot:process="{ style }">
      <div class="vue-slider-process" :style="style">
        <div
          v-if="showMergeTooltip"
          :class="[
            'merge-tooltip',
            'vue-slider-dot-tooltip-inner',
            'vue-slider-dot-tooltip-inner-top'
          ]"
        >
          <span v-if="sliderValueLocal[0] === sliderValueLocal[1]">{{
            sliderValueLocal[0]
          }}</span>
          <span v-if="sliderValueLocal[0] !== sliderValueLocal[1]"
            >{{ sliderValueLocal[0] }} - {{ sliderValueLocal[1] }}</span
          >
        </div>
      </div>
    </template>
  </vue-slider>
</template>

<style scoped>
.merge-tooltip {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translate(-50%, -15px);
}

.vue-slider-process {
  background-color: var(--slider-main-color) !important;
}

.vue-slider-dot-tooltip-inner {
  background-color: var(--slider-tooltip-color) !important;
  border-color: var(--slider-tooltip-color) !important;
}
</style>
