import type { Chart } from 'chart.js'
import { getIsDark } from '~/composables/useTheme'

const newImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img: HTMLImageElement = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Helper function to safely get dark theme state
const getIsDarkTheme = () => getIsDark()

// Cache for QR code images to prevent flickering
const qrCodeCache = new Map<string, HTMLImageElement>()

// Export function to clear cache when theme changes
export const clearQRCodeCache = () => {
  qrCodeCache.clear()
}

const drawQRCode = async (chart: Chart, url: string) => {
  const { ctx } = chart
  if (!ctx) return

  // Dynamic import - only loads when actually drawing QR code
  const { default: QRCode } = await import('qrcode')

  // QR code should be white in dark mode, black in light mode
  const isDarkMode = getIsDarkTheme()
  const qrColor = isDarkMode ? '#ffffff' : '#000000'
  const cacheKey = `${url}|${qrColor}`

  // Get or generate QR code
  let qrLogo = qrCodeCache.get(cacheKey)
  if (!qrLogo) {
    const qrSrc = await QRCode.toDataURL(url, {
      color: {
        dark: qrColor,
        light: '#00000000' // Transparent background
      }
    })
    qrLogo = await newImage(qrSrc)
    qrCodeCache.set(cacheKey, qrLogo)
  }

  const s = 60
  ctx.drawImage(qrLogo, chart.width - s, 0, s, s)
}

/**
 * Chart.js plugin to display a QR code linking to the chart
 *
 * Feature Gate: Controlled by `qrCodeUrl` option in chart config
 * - HIDE_QR feature (Tier 2 - Pro) allows hiding the QR code
 * - Non-Pro users always see the QR code (enforced in makeBarLineChartConfig)
 */
export const getQRCodePlugin = () => {
  return {
    id: 'QRCodePlugin',
    afterDraw: async (chart: Chart) => {
      const url = chart.options.plugins?.qrCodeUrl
      if (url) {
        await drawQRCode(chart, url)
      }
    }
  }
}
