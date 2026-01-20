import type { Chart } from 'chart.js'

const newImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img: HTMLImageElement = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Cache for QR code images to prevent flickering
const qrCodeCache = new Map<string, HTMLImageElement>()

// Export function to clear cache when theme changes
export const clearQRCodeCache = () => {
  qrCodeCache.clear()
}

// Track chart generation to prevent stale async draws from completing
let drawGeneration = 0

const drawQRCode = async (chart: Chart, url: string, isDarkMode: boolean, generation: number) => {
  const { ctx } = chart
  if (!ctx) return

  // Dynamic import - only loads when actually drawing QR code
  const { default: QRCode } = await import('qrcode')

  // Check if this draw is still valid (chart hasn't been replaced)
  if (generation !== drawGeneration) return

  // QR code should be white in dark mode, black in light mode
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

  // Final check before drawing - ensure this generation is still current
  if (generation !== drawGeneration || !chart.ctx) return

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
    // Increment generation when chart is created to invalidate pending draws
    beforeInit: () => {
      drawGeneration++
    },
    afterDraw: async (chart: Chart) => {
      const plugins = chart.options.plugins as { qrCodeUrl?: string, isDarkMode?: boolean }
      const url = plugins?.qrCodeUrl
      const isDarkMode = plugins?.isDarkMode ?? false
      if (url) {
        // Capture current generation for this draw operation
        const currentGeneration = drawGeneration
        await drawQRCode(chart, url, isDarkMode, currentGeneration)
      }
    }
  }
}
