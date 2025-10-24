export const compress = async (
  str: string,
  encoding = 'deflate' as CompressionFormat
): Promise<ArrayBuffer> => {
  const byteArray = new TextEncoder().encode(str)
  try {
    const cs = new CompressionStream(encoding)
    const writer = cs.writable.getWriter()
    writer.write(byteArray)
    writer.close()
    return new Response(cs.readable).arrayBuffer()
  } catch (e) {
    console.error(e)
    return new Response(byteArray).arrayBuffer()
  }
}

export const decompress = async (
  byteArrayBuffer: ArrayBuffer,
  encoding = 'deflate' as CompressionFormat
): Promise<string> => {
  const byteArray = new Uint8Array(byteArrayBuffer)
  try {
    const cs = new DecompressionStream(encoding)
    const writer = cs.writable.getWriter()
    writer.write(byteArray)
    writer.close()
    const arrayBuffer = await new Response(cs.readable).arrayBuffer()
    return new TextDecoder().decode(arrayBuffer)
  } catch (e) {
    console.error(e)
    return new TextDecoder().decode(byteArray)
  }
}

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] || 0)
  }
  return window.btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
