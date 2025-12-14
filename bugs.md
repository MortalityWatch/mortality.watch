Pre-existing SSR vs Client Parity Issues

  Here are the issues that need investigation. These all existed before the state resolution unification work.

  1. Matrix Chart + Excess Mode Shows All 0.0%

  Problem: When rendering a matrix heatmap chart with excess mode (e=1), all values display as 0.0% instead of actual excess percentages.

  Reproduction:
  - URL: /chart.png?c=USA&t=asmr&ct=yearly&cs=matrix&sb=1&bm=mean&bf=2015&bt=2019&e=1&p=1&sl=1
  - Expected: Values like +15.6%, +19.1% etc (visible in client)
  - Actual: All cells show 0.0%

  Working cases:
  - Matrix without excess (e=0): Shows correct ASMR values ✓
  - Bar chart with excess (cs=bar&e=1): Shows correct excess percentages ✓

  Likely cause: The SSR data transformation for matrix + excess combination isn't computing or accessing the asmr_who_excess values correctly. Check app/lib/chart/datasets.ts and how getKeyForType()
   with isExcess=true interacts with the data loaded by server/services/dataLoader.ts.

  2. Bar Chart Data Labels Positioned Incorrectly

  Problem: In SSR-rendered bar charts, data labels appear inside/below bars instead of on top.

  Files to investigate:
  - app/lib/chart/config/chartPlugins.ts - datalabels plugin configuration
  - server/utils/chartRenderer.ts - how Chart.js is configured for server-side rendering

  Likely cause: Chart.js datalabels plugin anchor/align options behaving differently in node-canvas vs browser canvas.

  3. Dark Mode Styling Differences

  Problem:
  - SSR background is darker gray, client is navy blue
  - SSR data labels have dark text, client has white text on dark background

  Files to investigate:
  - app/composables/useTheme.ts - serverDarkModeOverride mechanism
  - app/lib/chart/chartConfig.ts - dark mode color configuration
  - Color constants used for dark mode backgrounds and text

  4. QR Code Differences

  Problem: QR codes rendered by SSR look different from client QR codes.

  Files to investigate:
  - Look for QR code generation library usage
  - Check if different libraries or configurations are used client vs server 


