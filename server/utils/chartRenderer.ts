/**
 * Server-side Chart Renderer
 *
 * Registers Chart.js components and plugins for server-side rendering
 */

import {
  Chart,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController
} from 'chart.js'
import { createCanvas, loadImage } from 'canvas'
import {
  BarWithErrorBar,
  BarWithErrorBarsController
} from 'chartjs-chart-error-bars'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix'
import QRCode from 'qrcode'

// Register Chart.js components and plugins
Chart.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  BarWithErrorBar,
  BarWithErrorBarsController,
  MatrixController,
  MatrixElement,
  ChartDataLabels
)

// Logo image as base64
const LOGO_SRC = 'data:image/png;base64,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'

/**
 * Full logo plugin for server-side rendering
 * Includes logo and QR code
 */
const createLogoPlugin = () => {
  return {
    id: 'LogoPlugin',
    beforeDraw: (chart: Chart) => {
      const { ctx } = chart
      if (!ctx) return

      ctx.save()
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, chart.width, chart.height)
      ctx.restore()
    },
    afterDraw: async (chart: Chart) => {
      const { ctx } = chart
      if (!ctx) return

      // Draw logo
      try {
        const logo = await loadImage(LOGO_SRC)
        const w = 60
        const h = w / (750 / 525)

        ctx.save()
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(10, 10, w, h)
        ctx.restore()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - node-canvas Image is compatible with CanvasImageSource
        ctx.drawImage(logo, 10, 10, w, h)
      } catch (err) {
        console.error('Failed to load logo:', err)
      }

      // Draw QR code if URL provided
      const qrCodeUrl = (chart.options.plugins as Record<string, unknown>)?.qrCodeUrl
      if (qrCodeUrl) {
        try {
          const qrSrc = await QRCode.toDataURL(qrCodeUrl as string, {
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          })
          const qrLogo = await loadImage(qrSrc)
          const s = 60
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - node-canvas Image is compatible with CanvasImageSource
          ctx.drawImage(qrLogo, chart.width - s, 0, s, s)
        } catch (err) {
          console.error('Failed to generate QR code:', err)
        }
      }
    }
  }
}

Chart.register(createLogoPlugin())

/**
 * Create a Chart.js instance with canvas
 */
export function createChartCanvas(width: number, height: number) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  return { canvas, ctx }
}

/**
 * Render a chart with the given configuration
 */
export async function renderChart(
  width: number,
  height: number,
  chartConfig: Record<string, unknown>,
  chartType: 'line' | 'bar' | 'matrix' = 'line'
): Promise<Buffer> {
  const { canvas, ctx } = createChartCanvas(width, height)

  // Merge config with server-specific overrides
  const serverConfig = {
    ...chartConfig,
    type: chartType,
    options: {
      ...((chartConfig.options as Record<string, unknown>) || {}),
      responsive: false,
      animation: false,
      devicePixelRatio: 2
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - node-canvas context is compatible but has different type
  const chart = new Chart(ctx, serverConfig)

  // Wait for chart to complete rendering
  await new Promise(resolve => setTimeout(resolve, 100))
  chart.update()

  return canvas.toBuffer('image/png')
}

/**
 * Render a simple placeholder chart
 * Used when data fetching fails or for testing
 */
export async function renderPlaceholderChart(
  width: number,
  height: number,
  title: string
): Promise<Buffer> {
  const config = {
    type: 'line',
    data: {
      labels: ['2020', '2021', '2022', '2023', '2024'],
      datasets: [
        {
          label: title,
          data: [100, 110, 95, 105, 115],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        title: {
          display: true,
          text: title
        },
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  }

  return renderChart(width, height, config, 'line')
}
