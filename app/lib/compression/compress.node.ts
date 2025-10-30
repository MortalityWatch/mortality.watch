import { deflateSync, inflateSync } from 'zlib'

export const compress = (str: string): ArrayBuffer => {
  const nodeBuffer = deflateSync(str)
  const arrayBuffer = nodeBuffer.buffer
  // Node.js Buffer.buffer returns ArrayBuffer | SharedArrayBuffer
  // We need to ensure it's an ArrayBuffer
  if (arrayBuffer instanceof ArrayBuffer) {
    return arrayBuffer
  }
  // If it's SharedArrayBuffer, convert to ArrayBuffer
  return nodeBuffer.buffer.slice(0)
}

export const decompress = (byteArrayBuffer: ArrayBuffer): string => {
  const buffer = Buffer.from(byteArrayBuffer)
  return inflateSync(buffer).toString('utf-8')
}

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  return Buffer.from(bytes).toString('base64')
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = Buffer.from(base64, 'base64').toString('binary')
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
