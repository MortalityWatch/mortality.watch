import type { Chart } from 'chart.js'
import QRCode from 'qrcode'
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

  // QR code should be white in dark mode, black in light mode
  const isDarkMode = getIsDarkTheme()
  const qrColor = isDarkMode ? '#ffffff' : '#000000'
  const cacheKey = `${url}|${qrColor}`

  console.log('[QRCodePlugin] Drawing QR code:', { isDarkMode, qrColor, cacheKey })

  // Get or generate QR code
  let qrLogo = qrCodeCache.get(cacheKey)
  if (!qrLogo) {
    console.log('[QRCodePlugin] Cache miss, generating new QR code')
    const qrSrc = await QRCode.toDataURL(url, {
      color: {
        dark: qrColor,
        light: '#00000000' // Transparent background
      }
    })
    qrLogo = await newImage(qrSrc)
    qrCodeCache.set(cacheKey, qrLogo)
    console.log('[QRCodePlugin] New QR code generated and cached')
  } else {
    console.log('[QRCodePlugin] Cache hit, using cached QR code')
  }

  const s = 60
  ctx.drawImage(qrLogo, chart.width - s, 0, s, s)
}

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
