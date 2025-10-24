import { textColor, backgroundColor } from '../../colors'
import type { Chart } from 'chart.js'
import QRCode from 'qrcode'

const newImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img: HTMLImageElement = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const drawQRCode = async (chart: Chart, url: string) => {
  const { ctx } = chart
  if (!ctx) return
  const qrSrc = await QRCode.toDataURL(url, {
    color: {
      dark: textColor(),
      light: backgroundColor()
    }
  })
  const qrLogo = await newImage(qrSrc)
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
