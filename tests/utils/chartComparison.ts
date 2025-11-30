import { PNG } from 'pngjs'

/**
 * Result of comparing two chart images pixel-by-pixel
 */
export interface ComparisonResult {
  /** Number of pixels that differ between the two images */
  mismatchPixels: number
  /** Percentage of pixels that differ (0-100) */
  mismatchPercent: number
  /** PNG buffer containing a visual diff image highlighting differences */
  diffImage: Buffer
  /** Dimensions of the compared images */
  dimensions: { width: number, height: number }
}

/**
 * Compare two chart images pixel-by-pixel using pixelmatch algorithm
 *
 * This function compares SSR-rendered charts with client-rendered charts
 * to ensure visual parity. It uses the pixelmatch library to perform
 * pixel-level comparison with configurable tolerance for minor rendering
 * differences (antialiasing, font rendering, etc.).
 *
 * @param ssrBuffer - PNG buffer from server-side rendered chart
 * @param clientBuffer - PNG buffer from client-side screenshot
 * @param threshold - Pixel color difference threshold (0-1). Default 0.1 allows for minor antialiasing differences
 * @returns Comparison result with mismatch statistics and diff image
 * @throws Error if image dimensions don't match
 *
 * @example
 * ```typescript
 * const ssrPng = await fetch('/chart.png?params').then(r => r.arrayBuffer())
 * const clientPng = await page.locator('canvas#chart').screenshot()
 * const result = await compareCharts(
 *   Buffer.from(ssrPng),
 *   clientPng,
 *   0.1
 * )
 * expect(result.mismatchPercent).toBeLessThan(2)
 * ```
 */
export async function compareCharts(
  ssrBuffer: Buffer,
  clientBuffer: Buffer,
  threshold = 0.1
): Promise<ComparisonResult> {
  // Parse PNG images
  const ssr = PNG.sync.read(ssrBuffer)
  const client = PNG.sync.read(clientBuffer)

  // Ensure dimensions match
  if (ssr.width !== client.width || ssr.height !== client.height) {
    throw new Error(
      `Dimension mismatch: SSR ${ssr.width}x${ssr.height} vs Client ${client.width}x${client.height}`
    )
  }

  // Create diff image
  const diff = new PNG({ width: ssr.width, height: ssr.height })

  // Use pixelmatch to compare images
  // Note: We use a custom implementation instead of the pixelmatch package
  // to avoid adding another dependency, since the algorithm is straightforward
  const mismatchPixels = comparePixels(
    ssr.data,
    client.data,
    diff.data,
    ssr.width,
    ssr.height,
    threshold
  )

  const totalPixels = ssr.width * ssr.height
  const mismatchPercent = (mismatchPixels / totalPixels) * 100

  return {
    mismatchPixels,
    mismatchPercent,
    diffImage: PNG.sync.write(diff),
    dimensions: { width: ssr.width, height: ssr.height }
  }
}

/**
 * Simple pixel comparison algorithm inspired by pixelmatch
 * Compares two RGBA images and highlights differences in the diff image
 *
 * @param img1 - First image data (RGBA)
 * @param img2 - Second image data (RGBA)
 * @param output - Output diff image data (RGBA)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param threshold - Color difference threshold (0-1)
 * @returns Number of mismatched pixels
 */
function comparePixels(
  img1: Buffer,
  img2: Buffer,
  output: Buffer,
  width: number,
  height: number,
  threshold: number
): number {
  let mismatchCount = 0
  const maxDelta = 35215 // Maximum color difference for RGBA

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = (y * width + x) * 4

      // Get RGBA values for both images
      const r1 = img1[pos]
      const g1 = img1[pos + 1]
      const b1 = img1[pos + 2]
      const a1 = img1[pos + 3]

      const r2 = img2[pos]
      const g2 = img2[pos + 1]
      const b2 = img2[pos + 2]
      const a2 = img2[pos + 3]

      // Calculate color difference using simple Euclidean distance
      const delta = colorDelta(r1, g1, b1, a1, r2, g2, b2, a2)

      // Normalize delta and compare to threshold
      if (delta / maxDelta > threshold) {
        // Pixel differs - mark as red in diff image
        mismatchCount++
        output[pos] = 255 // R
        output[pos + 1] = 0 // G
        output[pos + 2] = 0 // B
        output[pos + 3] = 255 // A
      } else {
        // Pixel matches - copy original grayscale
        const gray = blend(r1, a1)
        output[pos] = gray
        output[pos + 1] = gray
        output[pos + 2] = gray
        output[pos + 3] = 255
      }
    }
  }

  return mismatchCount
}

/**
 * Calculate color difference between two RGBA pixels
 * Uses Euclidean distance in RGBA color space
 */
function colorDelta(
  r1: number,
  g1: number,
  b1: number,
  a1: number,
  r2: number,
  g2: number,
  b2: number,
  a2: number
): number {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  const da = a1 - a2

  return dr * dr + dg * dg + db * db + da * da
}

/**
 * Blend a color component with alpha channel
 * Converts to grayscale considering transparency
 */
function blend(c: number, a: number): number {
  return 255 + (c - 255) * (a / 255)
}
