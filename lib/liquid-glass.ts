/**
 * Liquid Glass Engine
 *
 * Physics-based refraction simulation using SVG displacement maps,
 * matching the effect from:
 *   - https://liquid-glass-eta.vercel.app/
 *   - https://kube.io/blog/liquid-glass-css-svg/
 *
 * Uses Snell's Law to compute per-pixel displacement via a convex squircle
 * surface function. Generates displacement + specular canvas data-URL maps
 * and builds an SVG <filter> chain (feDisplacementMap + feBlend) that can
 * be consumed as `backdrop-filter: url(#id)` in Chromium.
 *
 * Non-Chromium browsers get an enhanced CSS glassmorphism fallback.
 */

// ─── Surface Functions ──────────────────────────────────────────────

export type SurfaceType = 'convex_squircle' | 'convex_circle' | 'concave' | 'lip'

export const SURFACE_FNS: Record<SurfaceType, (x: number) => number> = {
  convex_squircle: (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25),
  convex_circle: (x) => Math.sqrt(1 - (1 - x) * (1 - x)),
  concave: (x) => 1 - Math.sqrt(1 - (1 - x) * (1 - x)),
  lip: (x) => {
    const convex = Math.pow(1 - Math.pow(1 - Math.min(x * 2, 1), 4), 0.25)
    const concave = 1 - Math.sqrt(1 - (1 - x) * (1 - x)) + 0.1
    const t = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3
    return convex * (1 - t) + concave * t
  },
}

// ─── Refraction Profile (Snell's Law) ───────────────────────────────

export function calculateRefractionProfile(
  glassThickness: number,
  bezelWidth: number,
  heightFn: (x: number) => number,
  ior: number,
  samples = 128
): Float64Array {
  const eta = 1 / ior
  function refract(nx: number, ny: number): [number, number] | null {
    const dot = ny
    const k = 1 - eta * eta * (1 - dot * dot)
    if (k < 0) return null
    const sq = Math.sqrt(k)
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny]
  }
  const profile = new Float64Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = i / samples
    const y = heightFn(x)
    const dx = x < 1 ? 0.0001 : -0.0001
    const y2 = heightFn(x + dx)
    const deriv = (y2 - y) / dx
    const mag = Math.sqrt(deriv * deriv + 1)
    const ref = refract(-deriv / mag, -1 / mag)
    if (!ref) { profile[i] = 0; continue }
    profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1])
  }
  return profile
}

// ─── Displacement Map (Canvas → data URL) ───────────────────────────

export function generateDisplacementMap(
  w: number, h: number,
  radius: number, bezelWidth: number,
  profile: Float64Array, maxDisp: number
): string {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 128; d[i + 1] = 128; d[i + 2] = 0; d[i + 3] = 255
  }
  const r = radius, rSq = r * r, r1Sq = (r + 1) ** 2
  const rBSq = Math.max(r - bezelWidth, 0) ** 2
  const wB = w - r * 2, hB = h - r * 2, S = profile.length
  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0
      const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0
      const dSq = x * x + y * y
      if (dSq > r1Sq || dSq < rBSq) continue
      const dist = Math.sqrt(dSq)
      const fromSide = r - dist
      const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq))
      if (op <= 0 || dist === 0) continue
      const cos = x / dist, sin = y / dist
      const bi = Math.min(((fromSide / bezelWidth) * S) | 0, S - 1)
      const disp = profile[bi] || 0
      const dX = (-cos * disp) / maxDisp, dY = (-sin * disp) / maxDisp
      const idx = (y1 * w + x1) * 4
      d[idx]     = (128 + dX * 127 * op + 0.5) | 0
      d[idx + 1] = (128 + dY * 127 * op + 0.5) | 0
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

// ─── Specular Highlight Map ─────────────────────────────────────────

export function generateSpecularMap(
  w: number, h: number,
  radius: number, bezelWidth: number,
  angle = Math.PI / 3
): string {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const d = img.data
  d.fill(0)
  const r = radius, rSq = r * r, r1Sq = (r + 1) ** 2
  const rBSq = Math.max(r - bezelWidth, 0) ** 2
  const wB = w - r * 2, hB = h - r * 2
  const sv = [Math.cos(angle), Math.sin(angle)]
  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0
      const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0
      const dSq = x * x + y * y
      if (dSq > r1Sq || dSq < rBSq) continue
      const dist = Math.sqrt(dSq)
      const fromSide = r - dist
      const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq))
      if (op <= 0 || dist === 0) continue
      const cos = x / dist, sin = -y / dist
      const dot = Math.abs(cos * sv[0] + sin * sv[1])
      const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2))
      const coeff = dot * edge
      const col = (255 * coeff) | 0
      const alpha = (col * coeff * op) | 0
      const idx = (y1 * w + x1) * 4
      d[idx] = col; d[idx + 1] = col; d[idx + 2] = col; d[idx + 3] = alpha
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

// ─── Build Full SVG Filter ──────────────────────────────────────────

export interface LiquidGlassConfig {
  /** Element width in px */
  width: number
  /** Element height in px */
  height: number
  /** Border radius in px */
  radius: number
  /** Surface profile — default convex_squircle (Apple's choice) */
  surface?: SurfaceType
  /** Virtual glass thickness — default 80 (demo default) */
  glassThickness?: number
  /** Bezel (curved edge) width — default 60 (demo default) */
  bezelWidth?: number
  /** Index of refraction — default 3.0 (demo default, exaggerated for effect) */
  ior?: number
  /** Multiplier on displacement scale — default 1.0 */
  scaleRatio?: number
  /** Gaussian blur stdDeviation — default 0.3 (demo default) */
  blur?: number
  /** Specular highlight opacity — default 0.5 (demo default) */
  specularOpacity?: number
  /** Saturation boost on refracted area — default 4 (demo default) */
  specularSaturation?: number
}

export interface LiquidGlassResult {
  filterId: string
  filterSvg: string
}

let _counter = 0

export function buildLiquidGlassFilter(config: LiquidGlassConfig): LiquidGlassResult {
  const {
    width: w,
    height: h,
    radius,
    surface = 'convex_squircle',
    glassThickness = 80,
    bezelWidth: rawBezel = 60,
    ior = 3.0,
    scaleRatio = 1.0,
    blur = 0.3,
    specularOpacity = 0.5,
    specularSaturation = 4,
  } = config

  const id = `lg-${++_counter}`

  if (w < 4 || h < 4) {
    return { filterId: id, filterSvg: '' }
  }

  const heightFn = SURFACE_FNS[surface]
  const clampedBezel = Math.min(rawBezel, radius - 1, Math.min(w, h) / 2 - 1)

  const profile = calculateRefractionProfile(glassThickness, clampedBezel, heightFn, ior, 128)
  const maxDisp = Math.max(...Array.from(profile).map(Math.abs)) || 1
  const dispUrl = generateDisplacementMap(w, h, radius, clampedBezel, profile, maxDisp)
  const specUrl = generateSpecularMap(w, h, radius, clampedBezel * 2.5)
  const scale = maxDisp * scaleRatio

  const filterSvg = `<filter id="${id}" x="0%" y="0%" width="100%" height="100%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blurred_source" />
      <feImage href="${dispUrl}" x="0" y="0" width="${w}" height="${h}" result="disp_map" />
      <feDisplacementMap in="blurred_source" in2="disp_map"
        scale="${scale}" xChannelSelector="R" yChannelSelector="G"
        result="displaced" />
      <feColorMatrix in="displaced" type="saturate" values="${specularSaturation}" result="displaced_sat" />
      <feImage href="${specUrl}" x="0" y="0" width="${w}" height="${h}" result="spec_layer" />
      <feComposite in="displaced_sat" in2="spec_layer" operator="in" result="spec_masked" />
      <feComponentTransfer in="spec_layer" result="spec_faded">
        <feFuncA type="linear" slope="${specularOpacity}" />
      </feComponentTransfer>
      <feBlend in="spec_masked" in2="displaced" mode="normal" result="with_sat" />
      <feBlend in="spec_faded" in2="with_sat" mode="normal" />
    </filter>`

  return { filterId: id, filterSvg }
}

// ─── Glass Mode ─────────────────────────────────────────────────────

export type GlassMode = 'refraction' | 'turbulence'

// ─── Turbulence Glass (feTurbulence-based, cross-browser) ───────────
//
// Inspired by lucasromerodb/liquid-glass-effect-macos.
// Uses SVG feTurbulence + feSpecularLighting + feDisplacementMap to
// produce an organic wavy/rippled distortion — no JS canvas needed,
// works in all browsers that support SVG filters.

export interface TurbulenceGlassConfig {
  /** feTurbulence baseFrequency (both axes) — default 0.01 */
  baseFrequency?: number
  /** feTurbulence numOctaves — default 1 */
  numOctaves?: number
  /** feTurbulence seed — default 5 */
  seed?: number
  /** feDisplacementMap scale — default 150 */
  displacementScale?: number
  /** feSpecularLighting specularExponent — default 100 */
  specularExponent?: number
  /** feSpecularLighting surfaceScale — default 5 */
  surfaceScale?: number
  /** feGaussianBlur stdDeviation for softening the noise map — default 3 */
  blurStdDeviation?: number
  /** fePointLight position — defaults to { x: -200, y: -200, z: 300 } */
  lightPosition?: { x: number; y: number; z: number }
}

export interface TurbulenceGlassResult {
  filterId: string
  filterSvg: string
}

export function buildTurbulenceGlassFilter(
  config: TurbulenceGlassConfig = {}
): TurbulenceGlassResult {
  const {
    baseFrequency = 0.01,
    numOctaves = 1,
    seed = 5,
    displacementScale = 150,
    specularExponent = 100,
    surfaceScale = 5,
    blurStdDeviation = 3,
    lightPosition = { x: -200, y: -200, z: 300 },
  } = config

  const id = `lg-turb-${++_counter}`
  const freq = `${baseFrequency} ${baseFrequency}`

  const filterSvg = `<filter id="${id}" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}"
        numOctaves="${numOctaves}" seed="${seed}" result="turbulence" />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="${blurStdDeviation}" result="softMap" />
      <feSpecularLighting in="softMap" surfaceScale="${surfaceScale}"
        specularConstant="1" specularExponent="${specularExponent}"
        lighting-color="white" result="specLight">
        <fePointLight x="${lightPosition.x}" y="${lightPosition.y}" z="${lightPosition.z}" />
      </feSpecularLighting>
      <feComposite in="specLight" operator="arithmetic"
        k1="0" k2="1" k3="1" k4="0" result="litImage" />
      <feDisplacementMap in="SourceGraphic" in2="softMap"
        scale="${displacementScale}" xChannelSelector="R" yChannelSelector="G" />
    </filter>`

  return { filterId: id, filterSvg }
}

// ─── Chromium Detection ─────────────────────────────────────────────

export function isChromium(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Chrome|Chromium|Edg/.test(navigator.userAgent)
}
