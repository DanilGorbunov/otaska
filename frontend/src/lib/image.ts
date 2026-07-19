// Client-side compression before upload — Convex storage bills and serves whatever
// bytes it's given, so an uncompressed phone photo (often 4-8MB) means slow uploads,
// slow feed loads, and real storage cost for no visible quality gain at the sizes
// these images actually render at (a 56px thumbnail doesn't need a 4000px source).
export type CompressPreset = 'avatar' | 'cover' | 'portfolio' | 'task'

const PRESETS: Record<CompressPreset, { maxDimension: number; quality: number }> = {
  avatar: { maxDimension: 512, quality: 0.85 },
  cover: { maxDimension: 1600, quality: 0.8 },
  portfolio: { maxDimension: 1280, quality: 0.82 },
  task: { maxDimension: 1600, quality: 0.82 },
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = url
  })
}

function fitDimensions(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) return { width, height }
  const scale = maxDimension / Math.max(width, height)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

// GIFs would lose animation on re-encode; SVGs are already vector and tiny — leave both alone.
const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml'])

export async function compressImage(file: File, preset: CompressPreset): Promise<File> {
  if (!file.type.startsWith('image/') || SKIP_TYPES.has(file.type)) return file

  const { maxDimension, quality } = PRESETS[preset]
  const img = await loadImage(file)
  try {
    const { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight, maxDimension)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file

    // Re-encoding a tiny/already-optimized image can occasionally come out larger — keep the original then.
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(img.src)
  }
}
