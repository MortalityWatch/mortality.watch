import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VueSlider', Slider)
})
