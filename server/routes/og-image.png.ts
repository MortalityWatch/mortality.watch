import { defineEventHandler, setHeader } from 'h3'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

// Cache the generated image and font in memory
let cachedImage: Buffer | null = null
let cachedFont: ArrayBuffer | null = null

export default defineEventHandler(async (event) => {
  // Return cached image if available
  if (cachedImage) {
    setHeader(event, 'Content-Type', 'image/png')
    setHeader(event, 'Cache-Control', 'public, max-age=86400')
    return cachedImage
  }

  // Load font (cached after first fetch)
  if (!cachedFont) {
    try {
      const fontResponse = await fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff')
      if (!fontResponse.ok) {
        throw new Error(`Font fetch failed: ${fontResponse.status}`)
      }
      cachedFont = await fontResponse.arrayBuffer()
    } catch (error) {
      console.error('Failed to load font for OG image:', error)
      throw createError({
        statusCode: 503,
        message: 'Failed to generate OG image - font unavailable'
      })
    }
  }
  const fontData = cachedFont

  // Generate SVG using satori
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
        },
        children: [
          // Top section
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '24px' },
              children: [
                // Logo row
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', alignItems: 'center', gap: '16px' },
                    children: [
                      // Logo circle
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '64px',
                            height: '64px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          },
                          children: [
                            {
                              type: 'svg',
                              props: {
                                width: 40,
                                height: 40,
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: 'white',
                                strokeWidth: 2,
                                children: [
                                  { type: 'path', props: { d: 'M3 3v18h18' } },
                                  { type: 'path', props: { d: 'm19 9-5 5-4-4-3 3' } }
                                ]
                              }
                            }
                          ]
                        }
                      },
                      // Brand name
                      {
                        type: 'span',
                        props: {
                          style: { fontSize: '28px', fontWeight: 700, color: '#94a3b8' },
                          children: 'Mortality Watch'
                        }
                      }
                    ]
                  }
                },
                // Title
                {
                  type: 'h1',
                  props: {
                    style: { fontSize: '56px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2, margin: 0 },
                    children: 'Track Global Mortality, Life Expectancy & Excess Deaths'
                  }
                },
                // Description
                {
                  type: 'p',
                  props: {
                    style: { fontSize: '24px', color: '#94a3b8', lineHeight: 1.4, margin: 0 },
                    children: 'The world\'s most comprehensive open mortality database with daily updates from 300+ countries and regions.'
                  }
                }
              ]
            }
          },
          // Bottom stats
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '48px' },
              children: [
                { type: 'div', props: { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [
                  { type: 'div', props: { style: { width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' } } },
                  { type: 'span', props: { style: { fontSize: '20px', color: '#94a3b8' }, children: '300+ Regions' } }
                ] } },
                { type: 'div', props: { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [
                  { type: 'div', props: { style: { width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' } } },
                  { type: 'span', props: { style: { fontSize: '20px', color: '#94a3b8' }, children: 'Updated Daily' } }
                ] } },
                { type: 'div', props: { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [
                  { type: 'div', props: { style: { width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' } } },
                  { type: 'span', props: { style: { fontSize: '20px', color: '#94a3b8' }, children: 'Open Source' } }
                ] } }
              ]
            }
          }
        ]
      }
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 700,
          style: 'normal'
        }
      ]
    }
  )

  // Convert SVG to PNG using resvg
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 }
  })
  const pngData = resvg.render()
  cachedImage = pngData.asPng()

  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  return cachedImage
})
