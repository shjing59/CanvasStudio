import type { LUTData } from '../../types/filter'

/**
 * Trilinear interpolation for LUT lookup
 * Returns interpolated RGB values from the 3D LUT
 */
function trilinearInterpolation(
  lutData: LUTData,
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const size = lutData.size
  const data = lutData.data
  
  // Clamp input values to [0, 1]
  r = Math.max(0, Math.min(1, r))
  g = Math.max(0, Math.min(1, g))
  b = Math.max(0, Math.min(1, b))
  
  // Scale to LUT coordinates
  const rScaled = r * (size - 1)
  const gScaled = g * (size - 1)
  const bScaled = b * (size - 1)
  
  // Get integer and fractional parts
  const r0 = Math.floor(rScaled)
  const g0 = Math.floor(gScaled)
  const b0 = Math.floor(bScaled)
  const r1 = Math.min(r0 + 1, size - 1)
  const g1 = Math.min(g0 + 1, size - 1)
  const b1 = Math.min(b0 + 1, size - 1)
  
  const rFrac = rScaled - r0
  const gFrac = gScaled - g0
  const bFrac = bScaled - b0
  
  // Helper to get LUT value at (r, g, b) coordinates
  const getLUTValue = (ri: number, gi: number, bi: number, channel: number): number => {
    const index = (bi * size * size + gi * size + ri) * 3 + channel
    return data[index]
  }
  
  // Get 8 corner values of the cube
  const c000 = [getLUTValue(r0, g0, b0, 0), getLUTValue(r0, g0, b0, 1), getLUTValue(r0, g0, b0, 2)]
  const c001 = [getLUTValue(r0, g0, b1, 0), getLUTValue(r0, g0, b1, 1), getLUTValue(r0, g0, b1, 2)]
  const c010 = [getLUTValue(r0, g1, b0, 0), getLUTValue(r0, g1, b0, 1), getLUTValue(r0, g1, b0, 2)]
  const c011 = [getLUTValue(r0, g1, b1, 0), getLUTValue(r0, g1, b1, 1), getLUTValue(r0, g1, b1, 2)]
  const c100 = [getLUTValue(r1, g0, b0, 0), getLUTValue(r1, g0, b0, 1), getLUTValue(r1, g0, b0, 2)]
  const c101 = [getLUTValue(r1, g0, b1, 0), getLUTValue(r1, g0, b1, 1), getLUTValue(r1, g0, b1, 2)]
  const c110 = [getLUTValue(r1, g1, b0, 0), getLUTValue(r1, g1, b0, 1), getLUTValue(r1, g1, b0, 2)]
  const c111 = [getLUTValue(r1, g1, b1, 0), getLUTValue(r1, g1, b1, 1), getLUTValue(r1, g1, b1, 2)]
  
  // Interpolate along b axis
  const c00 = [
    c000[0] * (1 - bFrac) + c001[0] * bFrac,
    c000[1] * (1 - bFrac) + c001[1] * bFrac,
    c000[2] * (1 - bFrac) + c001[2] * bFrac,
  ]
  const c01 = [
    c010[0] * (1 - bFrac) + c011[0] * bFrac,
    c010[1] * (1 - bFrac) + c011[1] * bFrac,
    c010[2] * (1 - bFrac) + c011[2] * bFrac,
  ]
  const c10 = [
    c100[0] * (1 - bFrac) + c101[0] * bFrac,
    c100[1] * (1 - bFrac) + c101[1] * bFrac,
    c100[2] * (1 - bFrac) + c101[2] * bFrac,
  ]
  const c11 = [
    c110[0] * (1 - bFrac) + c111[0] * bFrac,
    c110[1] * (1 - bFrac) + c111[1] * bFrac,
    c110[2] * (1 - bFrac) + c111[2] * bFrac,
  ]
  
  // Interpolate along g axis
  const c0 = [
    c00[0] * (1 - gFrac) + c01[0] * gFrac,
    c00[1] * (1 - gFrac) + c01[1] * gFrac,
    c00[2] * (1 - gFrac) + c01[2] * gFrac,
  ]
  const c1 = [
    c10[0] * (1 - gFrac) + c11[0] * gFrac,
    c10[1] * (1 - gFrac) + c11[1] * gFrac,
    c10[2] * (1 - gFrac) + c11[2] * gFrac,
  ]
  
  // Interpolate along r axis
  const result = [
    c0[0] * (1 - rFrac) + c1[0] * rFrac,
    c0[1] * (1 - rFrac) + c1[1] * rFrac,
    c0[2] * (1 - rFrac) + c1[2] * rFrac,
  ]
  
  return [result[0], result[1], result[2]]
}

/**
 * Apply LUT to canvas context
 * Uses trilinear interpolation for smooth results
 * 
 * @param ctx - Canvas rendering context
 * @param lutData - LUT data to apply
 * @param intensity - Filter intensity (0-1)
 * @param imageRect - Rectangle bounds of the image on canvas
 */
export function applyLUTToCanvas(
  ctx: CanvasRenderingContext2D,
  lutData: LUTData,
  intensity: number,
  imageRect: { x: number; y: number; width: number; height: number }
): void {
  // Clamp intensity to [0, 1]
  intensity = Math.max(0, Math.min(1, intensity))
  
  // If intensity is 0, no filter applied
  if (intensity === 0) {
    return
  }
  
  // Get ImageData from canvas
  const imageData = ctx.getImageData(
    Math.floor(imageRect.x),
    Math.floor(imageRect.y),
    Math.ceil(imageRect.width),
    Math.ceil(imageRect.height)
  )
  
  const data = imageData.data
  
  // Process each pixel (all pixels, including background)
  // LUT filters typically process the entire image including background
  for (let i = 0; i < data.length; i += 4) {
    // Get normalized RGB values (0-1)
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255
    
    // Apply LUT lookup with trilinear interpolation
    const [newR, newG, newB] = trilinearInterpolation(lutData, r, g, b)
    
    // Blend with original based on intensity
    const finalR = r * (1 - intensity) + newR * intensity
    const finalG = g * (1 - intensity) + newG * intensity
    const finalB = b * (1 - intensity) + newB * intensity
    
    // Write back (clamp to [0, 1] then scale to [0, 255])
    data[i] = Math.round(Math.max(0, Math.min(1, finalR)) * 255)
    data[i + 1] = Math.round(Math.max(0, Math.min(1, finalG)) * 255)
    data[i + 2] = Math.round(Math.max(0, Math.min(1, finalB)) * 255)
    // Alpha channel (data[i + 3]) remains unchanged
  }
  
  // Put processed data back to canvas
  ctx.putImageData(imageData, Math.floor(imageRect.x), Math.floor(imageRect.y))
}
