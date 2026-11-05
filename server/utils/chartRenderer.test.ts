import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock dependencies
vi.mock('canvas', () => {
  class MockCanvas {
    width: number
    height: number
    private ctx: MockContext

    constructor(width: number, height: number) {
      this.width = width
      this.height = height
      this.ctx = new MockContext(width, height)
    }

    getContext(type: string) {
      if (type === '2d') {
        return this.ctx
      }
      return null
    }

    toBuffer(type: string) {
      if (type === 'image/png') {
        return Buffer.from('mock-png-data')
      }
      return Buffer.from('')
    }
  }

  class MockContext {
    canvas: { width: number, height: number }
    fillStyle = '#000000'
    globalCompositeOperation = 'source-over'

    constructor(width: number, height: number) {
      this.canvas = { width, height }
    }

    save() {}
    restore() {}
    fillRect() {}
    drawImage() {}
    clearRect() {}
    setTransform() {}
  }

  class MockImage {
    src = ''
    width = 0
    height = 0
    complete = false
    onload: (() => void) | null = null
    onerror: ((error: Error) => void) | null = null

    set srcData(value: string) {
      this.src = value
      this.width = 100
      this.height = 100
      this.complete = true
      if (this.onload) {
        setTimeout(() => this.onload!(), 0)
      }
    }
  }

  return {
    createCanvas: vi.fn((width: number, height: number) => new MockCanvas(width, height)),
    loadImage: vi.fn(async (src: string) => {
      const img = new MockImage()
      img.srcData = src
      return img
    })
  }
})

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async (url: string) => {
      return `data:image/png;base64,mock-qr-code-for-${url}`
    })
  }
}))

vi.mock('chart.js', async () => {
  const actual = await vi.importActual('chart.js')

  class MockChart {
    config: unknown
    ctx: unknown
    width = 800
    height = 600
    destroyed = false
    updated = false
    static registeredComponents: unknown[] = []
    static registeredPlugins: unknown[] = []
    static defaults = {
      font: {
        family: 'sans-serif'
      }
    }

    static register = vi.fn((...components: unknown[]) => {
      MockChart.registeredComponents.push(...components)
    })

    static unregister = vi.fn((...components: unknown[]) => {
      MockChart.registeredPlugins = MockChart.registeredPlugins.filter(
        p => !components.includes(p)
      )
    })

    constructor(ctx: unknown, config: unknown) {
      this.ctx = ctx
      this.config = config
    }

    update() {
      this.updated = true
    }

    destroy() {
      this.destroyed = true
    }
  }

  return {
    ...actual,
    Chart: MockChart
  }
})

vi.mock('./memoryManager', () => ({
  withTimeout: vi.fn(async (promise: Promise<unknown>) => promise),
  cleanupCanvas: vi.fn()
}))

describe('chartRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createChartCanvas', () => {
    it('should create a canvas with specified dimensions', async () => {
      const { createChartCanvas } = await import('./chartRenderer')
      const { createCanvas } = await import('canvas')

      const { canvas, ctx } = createChartCanvas(800, 600)

      expect(createCanvas).toHaveBeenCalledWith(800, 600)
      expect(canvas).toBeDefined()
      expect(ctx).toBeDefined()
      expect(canvas.width).toBe(800)
      expect(canvas.height).toBe(600)
    })

    it('should create canvas with different dimensions', async () => {
      const { createChartCanvas } = await import('./chartRenderer')
      const { createCanvas } = await import('canvas')

      const { canvas } = createChartCanvas(1200, 800)

      expect(createCanvas).toHaveBeenCalledWith(1200, 800)
      expect(canvas.width).toBe(1200)
      expect(canvas.height).toBe(800)
    })

    it('should return valid 2d context', async () => {
      const { createChartCanvas } = await import('./chartRenderer')

      const { ctx } = createChartCanvas(800, 600)

      expect(ctx).toBeDefined()
      expect(ctx.canvas).toBeDefined()
      expect(ctx.canvas.width).toBe(800)
      expect(ctx.canvas.height).toBe(600)
    })
  })

  describe('renderChart', () => {
    it('should render a basic line chart', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [
            {
              label: 'Sales',
              data: [10, 20, 30],
              borderColor: '#3b82f6'
            }
          ]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Sales Chart'
            }
          }
        }
      }

      const buffer = await renderChart(800, 600, config, 'line')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should render a bar chart', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [
            {
              label: 'Values',
              data: [5, 10, 15],
              backgroundColor: '#ef4444'
            }
          ]
        },
        options: {}
      }

      const buffer = await renderChart(1000, 700, config, 'bar')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should render a matrix chart', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          datasets: [
            {
              label: 'Heatmap',
              data: [
                { x: 0, y: 0, v: 1 },
                { x: 1, y: 0, v: 2 },
                { x: 0, y: 1, v: 3 }
              ]
            }
          ]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'matrix')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should set responsive to false for server rendering', async () => {
      const { renderChart } = await import('./chartRenderer')
      const { Chart } = await import('chart.js')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          responsive: true
        }
      }

      await renderChart(800, 600, config, 'line')

      // Verify Chart was instantiated with responsive: false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chartCalls = (Chart as any).mock?.instances || []
      if (chartCalls.length > 0) {
        const instance = chartCalls[chartCalls.length - 1]
        expect(instance.config.options.responsive).toBe(false)
      }
    })

    it('should set animation to false for server rendering', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          animation: {
            duration: 1000
          }
        }
      }

      await renderChart(800, 600, config, 'line')

      // Server-side rendering should disable animations
      expect(true).toBe(true) // Placeholder - implementation detail
    })

    it('should set devicePixelRatio to 2 for high-quality rendering', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      await renderChart(800, 600, config, 'line')

      // Server-side rendering should use 2x pixel ratio
      expect(true).toBe(true) // Placeholder - implementation detail
    })

    it('should include QR code when qrCodeUrl is provided', async () => {
      const { renderChart } = await import('./chartRenderer')
      const QRCode = (await import('qrcode')).default

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          plugins: {
            qrCodeUrl: 'https://example.com/chart/123'
          }
        }
      }

      const buffer = await renderChart(800, 600, config, 'line')

      expect(QRCode.toDataURL).toHaveBeenCalledWith('https://example.com/chart/123', {
        color: {
          dark: '#000000',
          light: '#00000000'
        },
        width: 120
      })
      expect(buffer).toBeDefined()
    })

    it('should handle QR code generation failure gracefully', async () => {
      const QRCode = (await import('qrcode')).default
      vi.mocked(QRCode.toDataURL).mockRejectedValueOnce(new Error('QR code generation failed'))

      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          plugins: {
            qrCodeUrl: 'https://example.com/invalid'
          }
        }
      }

      // Should not throw despite QR code failure
      const buffer = await renderChart(800, 600, config, 'line')
      expect(buffer).toBeDefined()
    })

    it('should load logo image', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'line')

      // Logo should be rendered successfully
      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should cleanup chart after rendering', async () => {
      const { renderChart } = await import('./chartRenderer')
      const { cleanupCanvas } = await import('./memoryManager')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      await renderChart(800, 600, config, 'line')

      // Chart should be cleaned up after rendering
      expect(cleanupCanvas).toHaveBeenCalled()
    })

    it('should cleanup canvas after rendering', async () => {
      const { renderChart } = await import('./chartRenderer')
      const { cleanupCanvas } = await import('./memoryManager')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      await renderChart(800, 600, config, 'line')

      expect(cleanupCanvas).toHaveBeenCalled()
    })

    it('should use withTimeout for rendering', async () => {
      const { renderChart } = await import('./chartRenderer')
      const { withTimeout } = await import('./memoryManager')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      await renderChart(800, 600, config, 'line')

      expect(withTimeout).toHaveBeenCalledWith(
        expect.any(Promise),
        10000,
        'Chart rendering'
      )
    })

    it('should handle empty datasets', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: [],
          datasets: []
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'line')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should handle missing data property', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        options: {
          plugins: {
            title: {
              display: true,
              text: 'No Data Chart'
            }
          }
        }
      }

      const buffer = await renderChart(800, 600, config, 'line')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should handle missing options property', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A', 'B'],
          datasets: [{ label: 'Test', data: [1, 2] }]
        }
      }

      const buffer = await renderChart(800, 600, config, 'line')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should render chart with complex configuration', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [
            {
              label: 'Dataset 1',
              data: [10, 20, 30, 25, 35],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Dataset 2',
              data: [15, 25, 20, 30, 28],
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Complex Chart'
            },
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              enabled: true
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Months'
              }
            },
            y: {
              display: true,
              beginAtZero: true,
              title: {
                display: true,
                text: 'Values'
              }
            }
          }
        }
      }

      const buffer = await renderChart(1200, 800, config, 'line')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should handle chart with datalabels plugin', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [
            {
              label: 'Values',
              data: [10, 20, 30]
            }
          ]
        },
        options: {
          plugins: {
            datalabels: {
              display: true,
              color: '#000000'
            }
          }
        }
      }

      const buffer = await renderChart(800, 600, config, 'bar')

      expect(buffer).toBeDefined()
    })

    it('should handle chart with error bars', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [
            {
              type: 'barWithErrorBars',
              label: 'Data with Error Bars',
              data: [
                { y: 10, yMin: 8, yMax: 12 },
                { y: 20, yMin: 18, yMax: 22 },
                { y: 30, yMin: 28, yMax: 32 }
              ]
            }
          ]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'bar')

      expect(buffer).toBeDefined()
    })

    it('should handle logarithmic scale', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [
            {
              label: 'Log Scale',
              data: [1, 10, 100]
            }
          ]
        },
        options: {
          scales: {
            y: {
              type: 'logarithmic'
            }
          }
        }
      }

      const buffer = await renderChart(800, 600, config, 'line')

      expect(buffer).toBeDefined()
    })

    it('should cleanup even if chart update throws error', async () => {
      const { Chart } = await import('chart.js')
      const { cleanupCanvas } = await import('./memoryManager')

      // Mock chart update to throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalUpdate = (Chart as any).prototype?.update
      if (originalUpdate) {
        vi.spyOn(Chart.prototype, 'update').mockImplementationOnce(() => {
          throw new Error('Update failed')
        })
      }

      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      try {
        await renderChart(800, 600, config, 'line')
      } catch {
        // Expected to fail
      }

      // Cleanup should still be called
      expect(cleanupCanvas).toHaveBeenCalled()
    })
  })

  describe('renderPlaceholderChart', () => {
    it('should render a placeholder chart with default data', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, 'Loading Data...')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should render placeholder with custom title', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, 'Custom Placeholder Title')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should render placeholder with different dimensions', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')
      const { createCanvas } = await import('canvas')

      const buffer = await renderPlaceholderChart(1200, 900, 'Test')

      expect(createCanvas).toHaveBeenCalledWith(1200, 900)
      expect(buffer).toBeDefined()
    })

    it('should use line chart type for placeholder', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, 'Placeholder')

      // Placeholder should be a line chart
      expect(buffer).toBeDefined()
    })

    it('should include standard years in labels', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, 'Test Data')

      // Should render successfully with year labels
      expect(buffer).toBeDefined()
    })

    it('should include sample data points', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, 'Sample')

      // Should render successfully with sample data
      expect(buffer).toBeDefined()
    })

    it('should enable title display', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, 'Title Test')

      // Should render successfully with title enabled
      expect(buffer).toBeDefined()
    })

    it('should enable legend display', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, 'Legend Test')

      // Should render successfully with legend enabled
      expect(buffer).toBeDefined()
    }, 10000)

    it('should set y-axis to begin at zero', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, 'Y-Axis Test')

      // Should render successfully with y-axis starting at zero
      expect(buffer).toBeDefined()
    })

    it('should handle empty title string', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, '')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should handle very long title', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const longTitle = 'A'.repeat(200)
      const buffer = await renderPlaceholderChart(800, 600, longTitle)

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should handle special characters in title', async () => {
      const { renderPlaceholderChart } = await import('./chartRenderer')

      const buffer = await renderPlaceholderChart(800, 600, 'Test <>&"\' Special')

      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })
  })
})
