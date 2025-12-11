import { backgroundColor } from './chartColors'
import type { Chart } from 'chart.js'

export const getBackgroundPlugin = () => {
  return {
    id: 'BackgroundPlugin',
    beforeDraw: (chart: Chart) => {
      const { ctx } = chart
      ctx.save()
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = backgroundColor()
      ctx.fillRect(0, 0, chart.width, chart.height + 1)
      ctx.restore()
    }
  }
}
