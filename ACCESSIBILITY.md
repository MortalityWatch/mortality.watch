# Accessibility Implementation

## Overview

This document outlines the accessibility improvements made to the Mortality Watch application and provides guidance for ongoing accessibility testing and maintenance.

## Implemented Tools

### 1. ESLint Plugin for Vue.js Accessibility

- **Package**: `eslint-plugin-vuejs-accessibility`
- **Configuration**: `eslint.config.mjs`
- **Rules**: Recommended rules from the plugin
- **Notes**: `label-has-for` rule disabled for Nuxt UI components which handle accessibility internally

### 2. Axe-Core

- **Package**: `axe-core`
- **Usage**: Runtime accessibility testing in browser DevTools
- **Installation**: Available for manual testing via browser extensions

## Current Accessibility Features

### Security Headers

✅ Implemented security headers in `nuxt.config.ts`:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy restrictions
- Content-Security-Policy with strict resource loading

### Code Quality

✅ Pre-commit hooks with husky + lint-staged
✅ Accessibility linting via ESLint plugin
✅ TypeScript strict mode enabled

## Manual Testing Checklist

### Screen Reader Testing

- [ ] Test with VoiceOver (macOS): `Cmd + F5`
- [ ] Test with NVDA (Windows)
- [ ] Verify all interactive elements are announced
- [ ] Check heading hierarchy (h1 → h2 → h3)
- [ ] Verify form labels are read correctly

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test Enter/Space on buttons
- [ ] Test Escape to close modals/dropdowns
- [ ] Verify no keyboard traps

### Visual Testing

- [ ] Check color contrast (WCAG AA: 4.5:1 for text)
- [ ] Verify no color-only information
- [ ] Test with browser zoom at 200%
- [ ] Check responsive design at all breakpoints

### Chart Accessibility

- [ ] Provide text alternatives for charts
- [ ] Consider adding data table views
- [ ] Ensure legends are descriptive
- [ ] Test keyboard navigation for interactive charts

## Browser DevTools Testing

### Using axe DevTools Extension

1. **Install Extension**:
   - Chrome: [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
   - Firefox: [axe DevTools](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)

2. **Run Scan**:

   ```
   - Open browser DevTools (F12)
   - Navigate to "axe DevTools" tab
   - Click "Scan ALL of my page"
   - Review issues by severity
   ```

3. **Fix Issues**:
   - Critical issues first
   - Use "Highlight" feature to locate elements
   - Follow "How to fix" guidance

### Using Lighthouse

1. **Run Audit**:

   ```
   - Open Chrome DevTools (F12)
   - Navigate to "Lighthouse" tab
   - Select "Accessibility" category
   - Click "Generate report"
   ```

2. **Review Results**:
   - Target score: 90+ (100 ideal)
   - Fix failing audits
   - Address warnings

## Semantic HTML Guidelines

### Page Structure

```vue
<template>
  <div>
    <nav aria-label="Main navigation">
      <!-- Navigation -->
    </nav>

    <main>
      <h1>Page Title</h1>
      <!-- Main content -->
    </main>

    <aside aria-label="Filters">
      <!-- Sidebar content -->
    </aside>

    <footer>
      <!-- Footer content -->
    </footer>
  </div>
</template>
```

### Form Controls

```vue
<!-- Good: Label associated with input -->
<label for="country-select">Select Country</label>
<select id="country-select" v-model="country">
  <option>USA</option>
</select>

<!-- Alternative: Input wrapped in label -->
<label>
  Select Country
  <select v-model="country">
    <option>USA</option>
  </select>
</label>
```

### Chart Alternatives

```vue
<div role="region" aria-label="Mortality data chart">
  <Chart :data="chartData" />

  <!-- Provide data table alternative -->
  <details>
    <summary>View data as table</summary>
    <DataTable :data="chartData" />
  </details>
</div>
```

## WCAG 2.1 Compliance Levels

### Level A (Minimum)

- Text alternatives for non-text content
- Captions for audio/video
- Keyboard accessible
- Sufficient time to read content
- No seizure-inducing content
- Skip navigation links
- Page titles
- Focus order
- Link purpose

### Level AA (Target)

- Color contrast: 4.5:1 for text, 3:1 for large text
- No images of text (except logos)
- Multiple ways to find pages
- Headings and labels descriptive
- Focus visible
- Language of page identified
- Error identification
- Labels or instructions for inputs

### Level AAA (Ideal)

- Color contrast: 7:1 for text
- No time limits
- No interruptions
- Re-authenticating preserves data
- Context-sensitive help

## Known Issues & Future Improvements

### To Address

1. **Form Labels**: Review all custom label implementations with Nuxt UI components
2. **Chart Accessibility**: Add data table alternatives for all charts
3. **Focus Management**: Verify focus trapping in modals/dialogs
4. **ARIA Landmarks**: Add role attributes to main page regions
5. **Error Handling**: Ensure error messages are announced to screen readers

### Recommended Additions

- [ ] Add `@nuxt/sitemap` for better SEO
- [ ] Implement skip-to-content link
- [ ] Add aria-live regions for dynamic updates
- [ ] Create accessibility statement page
- [ ] Document keyboard shortcuts

## Resources

### Tools

- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse (Chrome DevTools)](https://developer.chrome.com/docs/lighthouse/)
- [VoiceOver (macOS)](https://www.apple.com/accessibility/voiceover/)
- [NVDA Screen Reader (Windows)](https://www.nvaccess.org/)

### Guidelines

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Vue.js Accessibility Guide](https://vuejs.org/guide/best-practices/accessibility.html)
- [Nuxt Accessibility](https://nuxt.com/docs/getting-started/accessibility)

### Testing

- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)

## Continuous Improvement

1. **Pre-commit Checks**: Accessibility linting runs automatically via husky
2. **CI/CD**: Consider adding Lighthouse CI for automated testing
3. **Regular Audits**: Schedule quarterly accessibility reviews
4. **User Feedback**: Collect feedback from users with disabilities
5. **Training**: Keep team updated on accessibility best practices
