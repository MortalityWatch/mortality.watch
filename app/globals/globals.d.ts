import { ToastServiceMethods } from 'primevue'

export {}

declare global {
  interface Window {
    $toast?: ToastServiceMethods
    disableToast: boolean
    lastErrorDate: Date
    lastErrorHash: string
    scale: number
  }

  interface Array<T> {
    last(): T | undefined // Return type should account for empty array
  }

  interface CompressionStreamConstructor {
    new (algorithm: string): TransformStream<Uint8Array, Uint8Array>
  }
  const CompressionStream: CompressionStreamConstructor

  interface DecompressionStreamConstructor {
    new (algorithm: string): TransformStream<Uint8Array, Uint8Array>
  }
  const DecompressionStream: DecompressionStreamConstructor

  type CompressionFormat = string
}

declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    qrCodeUrl?: string
  }

  interface ChartTypeRegistry {
    matrix: {
      chartOptions: MatrixChartOptions
      datasetOptions: MatrixDatasetOptions
      defaultDataPoint: MatrixDataPoint
      scales: keyof CartesianScaleTypeRegistry
    }
  }
}
