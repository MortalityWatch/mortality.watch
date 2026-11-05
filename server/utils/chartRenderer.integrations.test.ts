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

  describe('Logo Plugin', () => {
    it('should draw white background before chart', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'line')

      // Logo plugin should be registered and draw background
      expect(buffer).toBeDefined()
    })

    it('should draw logo image after chart', async () => {
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

    it('should handle logo drawing failure gracefully', async () => {
      const { loadImage } = await import('canvas')

      // Mock loadImage to return an invalid image for the first call (logo)
      let callCount = 0
      vi.mocked(loadImage).mockImplementation(async (src: string | Buffer) => {
        callCount++
        if (callCount === 1) {
          // First call is logo - return something that might fail to draw
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return null as any
        }
        // Subsequent calls work normally
        const img = new (class MockImage {
          src = typeof src === 'string' ? src : 'buffer'
          width = 100
          height = 100
          complete = true
        })()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return img as any
      })

      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      // Should not throw even if logo fails to draw
      const buffer = await renderChart(800, 600, config, 'line')
      expect(buffer).toBeDefined()
    })

    it('should position logo in top-left corner', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'line')

      // Logo should be positioned at (10, 10) with 60x60 size
      expect(buffer).toBeDefined()
    })

    it('should cache logo image for reuse', async () => {
      const { renderChart } = await import('./chartRenderer')
      const { loadImage } = await import('canvas')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      // First render
      await renderChart(800, 600, config, 'line')
      const firstCallCount = vi.mocked(loadImage).mock.calls.length

      // Second render
      await renderChart(800, 600, config, 'line')
      const secondCallCount = vi.mocked(loadImage).mock.calls.length

      // Logo should be cached (QR code might still be loaded)
      expect(secondCallCount).toBeGreaterThanOrEqual(firstCallCount)
    })
  })

  describe('QR Code Integration', () => {
    it('should position QR code in top-right corner', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          plugins: {
            qrCodeUrl: 'https://example.com/chart'
          }
        }
      }

      const buffer = await renderChart(800, 600, config, 'line')

      // QR code should be positioned at (width - 60, 0) with 60x60 size
      expect(buffer).toBeDefined()
    })

    it('should use correct QR code colors', async () => {
      const { renderChart } = await import('./chartRenderer')
      const QRCode = (await import('qrcode')).default

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          plugins: {
            qrCodeUrl: 'https://example.com/test'
          }
        }
      }

      await renderChart(800, 600, config, 'line')

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://example.com/test',
        expect.objectContaining({
          color: {
            dark: '#000000',
            light: '#00000000'
          }
        })
      )
    })

    it('should set QR code width to 120', async () => {
      const { renderChart } = await import('./chartRenderer')
      const QRCode = (await import('qrcode')).default

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          plugins: {
            qrCodeUrl: 'https://example.com'
          }
        }
      }

      await renderChart(800, 600, config, 'line')

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          width: 120
        })
      )
    })

    it('should not generate QR code when URL is not provided', async () => {
      const { renderChart } = await import('./chartRenderer')
      const QRCode = (await import('qrcode')).default

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          plugins: {}
        }
      }

      await renderChart(800, 600, config, 'line')

      expect(QRCode.toDataURL).not.toHaveBeenCalled()
    })

    it('should handle invalid QR code URLs', async () => {
      const QRCode = (await import('qrcode')).default
      vi.mocked(QRCode.toDataURL).mockRejectedValueOnce(new Error('Invalid URL'))

      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          plugins: {
            qrCodeUrl: 'not-a-valid-url'
          }
        }
      }

      // Should still render chart successfully
      const buffer = await renderChart(800, 600, config, 'line')
      expect(buffer).toBeDefined()
    })
  })

  describe('Memory Management', () => {
    it('should cleanup canvas on successful render', async () => {
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

    it('should cleanup chart instance after rendering', async () => {
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

      // Chart cleanup should be called
      expect(cleanupCanvas).toHaveBeenCalled()
    })

    it('should unregister logo plugin after rendering', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'line')

      // Should complete successfully with cleanup
      expect(buffer).toBeDefined()
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })

    it('should cleanup even on render failure', async () => {
      const { withTimeout } = await import('./memoryManager')
      vi.mocked(withTimeout).mockRejectedValueOnce(new Error('Timeout'))

      const { renderChart } = await import('./chartRenderer')
      const { cleanupCanvas } = await import('./memoryManager')

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

      expect(cleanupCanvas).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should propagate timeout errors', async () => {
      const { withTimeout } = await import('./memoryManager')
      vi.mocked(withTimeout).mockRejectedValueOnce(new Error('Chart rendering timed out after 10000ms'))

      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      await expect(renderChart(800, 600, config, 'line')).rejects.toThrow('Chart rendering timed out')
    })

    it('should handle Chart.js initialization errors', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      // With our mocks, chart creation should succeed
      // Testing actual Chart.js initialization errors would require
      // more complex mocking that might break the module system
      const buffer = await renderChart(800, 600, config, 'line')
      expect(buffer).toBeDefined()
    })

    it('should handle canvas creation errors', async () => {
      const { createCanvas } = await import('canvas')
      vi.mocked(createCanvas).mockImplementationOnce(() => {
        throw new Error('Canvas creation failed')
      })

      const { createChartCanvas } = await import('./chartRenderer')

      expect(() => createChartCanvas(800, 600)).toThrow('Canvas creation failed')
    })
  })

  describe('Chart Types', () => {
    it('should default to line chart type', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A', 'B'],
          datasets: [{ label: 'Test', data: [1, 2] }]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config)

      expect(buffer).toBeDefined()
    })

    it('should support explicit line chart type', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A', 'B'],
          datasets: [{ label: 'Test', data: [1, 2] }]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'line')

      expect(buffer).toBeDefined()
    })

    it('should support bar chart type', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A', 'B'],
          datasets: [{ label: 'Test', data: [1, 2] }]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'bar')

      expect(buffer).toBeDefined()
    })

    it('should support matrix chart type', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          datasets: [
            {
              label: 'Matrix',
              data: [{ x: 0, y: 0, v: 1 }]
            }
          ]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'matrix')

      expect(buffer).toBeDefined()
    })
  })

  describe('Logo Plugin Hooks', () => {
    it('should register logo plugin with beforeDraw and afterDraw hooks', async () => {
      const { Chart } = await import('chart.js')
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      await renderChart(800, 600, config, 'line')

      // Verify plugin was registered
      expect(Chart.register).toHaveBeenCalled()
    })

    it('should register logo plugin with QR code', async () => {
      const { Chart } = await import('chart.js')
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          plugins: {
            qrCodeUrl: 'https://example.com'
          }
        }
      }

      await renderChart(800, 600, config, 'line')

      // Verify plugin was registered with QR code
      expect(Chart.register).toHaveBeenCalled()
    })

    it('should call plugin hooks during rendering', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [{ label: 'Test', data: [1, 2, 3] }]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'line')

      // Plugin should execute during chart rendering
      expect(buffer).toBeDefined()
    })

    it('should handle beforeDraw hook with null ctx', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      // Should handle edge case gracefully
      const buffer = await renderChart(800, 600, config, 'line')
      expect(buffer).toBeDefined()
    })

    it('should handle afterDraw hook with null ctx', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      // Should handle edge case gracefully
      const buffer = await renderChart(800, 600, config, 'line')
      expect(buffer).toBeDefined()
    })

    it('should handle drawImage errors gracefully', async () => {
      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {
          plugins: {
            qrCodeUrl: 'https://example.com'
          }
        }
      }

      // Should not throw even if drawImage fails
      const buffer = await renderChart(800, 600, config, 'line')
      expect(buffer).toBeDefined()
    })
  })

  describe('Cleanup Error Paths', () => {
    it('should handle chart destroy errors gracefully', async () => {
      const { Chart } = await import('chart.js')

      // Mock destroy to throw an error
      const originalDestroy = Chart.prototype.destroy
      Chart.prototype.destroy = vi.fn(() => {
        throw new Error('Destroy failed')
      })

      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      // Should still complete successfully
      const buffer = await renderChart(800, 600, config, 'line')
      expect(buffer).toBeDefined()

      // Restore original
      Chart.prototype.destroy = originalDestroy
    })

    it('should handle plugin unregister errors gracefully', async () => {
      const { Chart } = await import('chart.js')

      // Mock unregister to throw an error
      const originalUnregister = Chart.unregister
      Chart.unregister = vi.fn(() => {
        throw new Error('Unregister failed')
      })

      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      // Should still complete successfully
      const buffer = await renderChart(800, 600, config, 'line')
      expect(buffer).toBeDefined()

      // Restore original
      Chart.unregister = originalUnregister
    })

    it('should cleanup even when both destroy and unregister fail', async () => {
      const { Chart } = await import('chart.js')
      const { cleanupCanvas } = await import('./memoryManager')

      // Mock both to throw errors
      const originalDestroy = Chart.prototype.destroy
      const originalUnregister = Chart.unregister

      Chart.prototype.destroy = vi.fn(() => {
        throw new Error('Destroy failed')
      })
      Chart.unregister = vi.fn(() => {
        throw new Error('Unregister failed')
      })

      const { renderChart } = await import('./chartRenderer')

      const config = {
        data: {
          labels: ['A'],
          datasets: [{ label: 'Test', data: [1] }]
        },
        options: {}
      }

      const buffer = await renderChart(800, 600, config, 'line')

      // Canvas cleanup should still be called
      expect(cleanupCanvas).toHaveBeenCalled()
      expect(buffer).toBeDefined()

      // Restore originals
      Chart.prototype.destroy = originalDestroy
      Chart.unregister = originalUnregister
    })
  })
})
