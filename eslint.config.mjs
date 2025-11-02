// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default withNuxt({
  rules: {
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: false,
        allowTernary: false,
        allowTaggedTemplates: false
      }
    ],
    'vue/no-v-html': 'off',
    // Disable unified-signatures due to bug with Vue 3 compiler macros (defineProps/defineEmits)
    '@typescript-eslint/unified-signatures': 'off'
  }
}).append({
  plugins: {
    'vuejs-accessibility': vueA11y
  },
  rules: {
    ...vueA11y.configs.recommended.rules,
    // Disable label-has-for for Nuxt UI components which handle accessibility internally
    'vuejs-accessibility/label-has-for': 'off'
  }
})
