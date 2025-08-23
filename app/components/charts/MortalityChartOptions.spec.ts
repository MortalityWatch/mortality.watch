import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MortalityChartOptions from './MortalityChartOptions.vue'

// Mock the router injection
const mockRouter = {
  update: vi.fn()
}

describe('Chart Options', () => {
  it('renders SpeedDial component', () => {
    const wrapper = mount(MortalityChartOptions, {
      global: {
        provide: {
          router: mockRouter
        },
        stubs: {
          SpeedDial: true
        }
      }
    })
    expect(wrapper.findComponent({ name: 'SpeedDial' }).exists()).toBe(true)
  })

  it('has correct SpeedDial items', () => {
    const wrapper = mount(MortalityChartOptions, {
      global: {
        provide: {
          router: mockRouter
        },
        stubs: {
          SpeedDial: true
        }
      }
    })
    const speedDial = wrapper.findComponent({ name: 'SpeedDial' })
    const items = speedDial.props('model')

    expect(items).toHaveLength(3)
    expect(items[0].label).toBe('Copy Link')
    expect(items[0].icon).toBe('pi pi-link')
    expect(items[1].label).toBe('Screenshot')
    expect(items[1].icon).toBe('pi pi-camera')
    expect(items[2].label).toBe('Save')
    expect(items[2].icon).toBe('pi pi-save')
  })
})
