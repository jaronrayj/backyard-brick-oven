import React, { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'

// Crop, zoom and rotate a photo before it uploads. Returns a JPEG blob at most
// OUTPUT_WIDTH wide. Big phone photos are first scaled to WORKING_EDGE so the
// canvases stay under mobile Safari's size limit.
const WORKING_EDGE = 3000
const OUTPUT_WIDTH = 1200

// Homepage cards show photos about 4:3 (src/components/PizzaDisplay).
const SHAPES = [
  { key: 'card', label: 'Menu card', aspect: 4 / 3 },
  { key: 'square', label: 'Square', aspect: 1 },
  { key: 'original', label: 'Original', aspect: null },
]

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

const toBlob = (canvas) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the image'))), 'image/jpeg', 0.82)
  )

// A smaller copy of the picked file to edit, as an object URL.
const workingCopy = async (file) => {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, WORKING_EDGE / Math.max(img.width, img.height))
    if (scale === 1) return url
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    return URL.createObjectURL(await toBlob(canvas))
  } catch (e) {
    return url
  }
}

const radians = (deg) => (deg * Math.PI) / 180

// Draw the rotated image, then cut out the crop (react-easy-crop gives the crop
// in the rotated image's coordinates) and scale it to OUTPUT_WIDTH.
const renderCrop = async (src, crop, rotation) => {
  const img = await loadImage(src)
  const r = radians(rotation)
  const w = Math.abs(Math.cos(r) * img.width) + Math.abs(Math.sin(r) * img.height)
  const h = Math.abs(Math.sin(r) * img.width) + Math.abs(Math.cos(r) * img.height)
  const rotated = document.createElement('canvas')
  rotated.width = Math.round(w)
  rotated.height = Math.round(h)
  const ctx = rotated.getContext('2d')
  ctx.translate(w / 2, h / 2)
  ctx.rotate(r)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)

  const scale = Math.min(1, OUTPUT_WIDTH / crop.width)
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(crop.width * scale))
  out.height = Math.max(1, Math.round(crop.height * scale))
  out.getContext('2d').drawImage(rotated, crop.x, crop.y, crop.width, crop.height, 0, 0, out.width, out.height)
  return toBlob(out)
}

const PhotoEditor = ({ file, onDone, onCancel }) => {
  const [src, setSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [shape, setShape] = useState('card')
  const [natural, setNatural] = useState(null)
  const [area, setArea] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let url = null
    let gone = false
    workingCopy(file).then((u) => {
      if (gone) URL.revokeObjectURL(u)
      else setSrc((url = u))
    })
    return () => {
      gone = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [file])

  const turned = rotation % 180 !== 0
  const chosen = SHAPES.find((s) => s.key === shape)
  const aspect =
    chosen.aspect ||
    (natural ? (turned ? natural.height / natural.width : natural.width / natural.height) : 4 / 3)

  const onComplete = useCallback((_, pixels) => setArea(pixels), [])

  const use = async () => {
    if (!area) return
    setBusy(true)
    setError('')
    try {
      onDone(await renderCrop(src, area, rotation))
    } catch (e) {
      setError("That photo couldn't be edited. Try another one.")
      setBusy(false)
    }
  }

  const btn = 'px-3 py-1.5 rounded-lg border text-sm font-medium'
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Edit photo">
      <div className="relative flex-1 min-h-0">
        {src ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            minZoom={1}
            maxZoom={4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            onMediaLoaded={(m) => setNatural({ width: m.naturalWidth, height: m.naturalHeight })}
          />
        ) : (
          <p className="text-gray-300 p-6">Opening photo…</p>
        )}
      </div>
      <div className="bg-gray-900 text-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] grid gap-3">
        <div className="flex gap-2 flex-wrap items-center">
          {SHAPES.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={shape === s.key}
              onClick={() => setShape(s.key)}
              className={`${btn} ${shape === s.key ? 'bg-white text-gray-900 border-white' : 'border-gray-600 text-gray-200'}`}
            >
              {s.label}
            </button>
          ))}
          <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)} className={`${btn} border-gray-600 text-gray-200 ml-auto`}>
            ↻ Rotate
          </button>
        </div>
        <label className="flex items-center gap-3 text-sm text-gray-300">
          Zoom
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1" />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className={`${btn} border-gray-600 text-gray-200`}>
            Cancel
          </button>
          <button type="button" onClick={use} disabled={busy || !area} className={`${btn} ml-auto bg-amber-600 border-amber-600 text-white disabled:opacity-50`}>
            {busy ? 'Saving…' : 'Use photo'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PhotoEditor
