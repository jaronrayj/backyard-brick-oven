import React, { useEffect, useMemo, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { ref, onValue, update, remove } from 'firebase/database'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, rtdb, signInWithGoogle } from '../../utils/firebase'
import { sortPizzas } from '../../utils'

// Menu manager: the website menu lives in the Realtime Database at `pizzas/`,
// one entry per pizza: { name, toppings, img, active, special, order }.
// The homepage shows active pizzas; `special` ones go under "Special of the Week".
// Only people listed under `menuAdmins/` may edit (the database rules enforce it):
// each key is a Google account email with every '.' replaced by ',', value true.

// Database keys can't contain . $ # [ ] /
const keyFor = (name) => name.trim().replace(/[.$#[\]/]/g, '_') || 'pizza'

// Phone photos are large: scale to at most 1600px wide as a JPEG before upload.
const shrinkImage = (file) =>
  new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, 1600 / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.82)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })

const uploadPhoto = async (file) => {
  const blob = await shrinkImage(file)
  const path = `pizzas/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`
  const snap = await uploadBytes(storageRef(getStorage(), path), blob, { contentType: 'image/jpeg' })
  return getDownloadURL(snap.ref)
}

const Toggle = ({ on, label, onClick, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-pressed={on}
    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
      on ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-gray-300 text-gray-600'
    } disabled:opacity-50`}
  >
    {label}
  </button>
)

const Editor = ({ pizza, onSave, onCancel, onDelete }) => {
  const [name, setName] = useState(pizza.name || '')
  const [toppings, setToppings] = useState(pizza.toppings || '')
  const [img, setImg] = useState(pizza.img || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      setImg(await uploadPhoto(file))
    } catch (err) {
      setError("The photo didn't upload. Check your connection and try again.")
    }
    setBusy(false)
  }

  const save = async () => {
    if (!name.trim()) {
      setError('Give the pizza a name.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave({ name: name.trim(), toppings: toppings.trim(), img: img.trim() })
    } catch (err) {
      setError("That didn't save. Make sure you're signed in as a menu admin.")
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-3 text-left">
      <label className="grid gap-1 text-sm text-gray-600">
        Name
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm text-gray-600">
        Toppings, separated by commas
        <textarea rows={2} className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900" value={toppings} onChange={(e) => setToppings(e.target.value)} />
      </label>
      <div className="grid gap-2 text-sm text-gray-600">
        Photo
        <div className="flex items-center gap-3 flex-wrap">
          {img ? <img src={img} alt="" className="h-20 w-28 object-cover rounded-lg" /> : <span className="text-gray-400">No photo yet</span>}
          <label className="px-3 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer text-gray-800">
            {busy ? 'Uploading…' : 'Upload photo'}
            <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
          </label>
          {img && (
            <button type="button" className="text-sm text-gray-500 underline" onClick={() => setImg('')}>
              Remove photo
            </button>
          )}
        </div>
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" placeholder="Or paste a photo link" value={img} onChange={(e) => setImg(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        <button type="button" disabled={busy} onClick={save} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
          Save
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 bg-white">
          Cancel
        </button>
        {onDelete &&
          (confirmDelete ? (
            <button type="button" onClick={onDelete} className="ml-auto px-4 py-2 rounded-lg bg-red-700 text-white">
              Delete for good
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="ml-auto px-4 py-2 rounded-lg text-red-700">
              Delete
            </button>
          ))}
      </div>
    </div>
  )
}

const PizzaRow = ({ id, pizza, editing, setEditing, move, canMoveUp, canMoveDown }) => {
  const [saving, setSaving] = useState(false)
  const set = async (fields) => {
    setSaving(true)
    try {
      await update(ref(rtdb, `pizzas/${id}`), fields)
    } finally {
      setSaving(false)
    }
  }

  if (editing === id) {
    return (
      <li className="bg-white rounded-xl shadow-sm p-4">
        <Editor
          pizza={pizza}
          onCancel={() => setEditing(null)}
          onSave={async (fields) => {
            await update(ref(rtdb, `pizzas/${id}`), fields)
            setEditing(null)
          }}
          onDelete={async () => {
            await remove(ref(rtdb, `pizzas/${id}`))
            setEditing(null)
          }}
        />
      </li>
    )
  }

  return (
    <li className="bg-white rounded-xl shadow-sm p-3 flex gap-3 items-center text-left">
      {pizza.img ? (
        <img src={pizza.img} alt="" loading="lazy" className="h-16 w-20 object-cover rounded-lg shrink-0" />
      ) : (
        <div className="h-16 w-20 rounded-lg bg-gray-100 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-semibold capitalize text-gray-900">{pizza.name}</div>
        <div className="text-sm text-gray-500 truncate">{pizza.toppings || 'No toppings listed'}</div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Toggle on={!!pizza.active} label="On the menu" disabled={saving} onClick={() => set({ active: !pizza.active })} />
          <Toggle on={!!pizza.special} label="Special of the week" disabled={saving} onClick={() => set({ special: !pizza.special })} />
          <button type="button" className="px-3 py-1.5 text-sm text-gray-600 underline" onClick={() => setEditing(id)}>
            Edit
          </button>
        </div>
      </div>
      {move && (
        <div className="flex flex-col gap-1 shrink-0">
          <button type="button" aria-label={`Move ${pizza.name} up`} disabled={!canMoveUp} onClick={() => move(-1)} className="w-9 h-9 rounded-lg border border-gray-300 bg-white disabled:opacity-30">
            ↑
          </button>
          <button type="button" aria-label={`Move ${pizza.name} down`} disabled={!canMoveDown} onClick={() => move(1)} className="w-9 h-9 rounded-lg border border-gray-300 bg-white disabled:opacity-30">
            ↓
          </button>
        </div>
      )}
    </li>
  )
}

const MenuAdmin = () => {
  const [user, loading] = useAuthState(auth)
  const [pizzas, setPizzas] = useState(null)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    if (!user || !user.emailVerified || !user.email) {
      setIsAdmin(false)
      return undefined
    }
    const key = user.email.toLowerCase().replace(/\./g, ',')
    return onValue(
      ref(rtdb, `menuAdmins/${key}`),
      (snap) => setIsAdmin(snap.val() === true),
      () => setIsAdmin(false)
    )
  }, [user])

  useEffect(() => onValue(ref(rtdb, 'pizzas'), (snap) => setPizzas(snap.val() || {})), [])

  const sorted = useMemo(() => sortPizzas(pizzas || {}), [pizzas])
  const onMenu = sorted.filter(([, p]) => p.active)
  const offMenu = sorted.filter(([, p]) => !p.active)

  // Reordering renumbers the whole on-menu list so the order stays clean.
  const move = (index, dir) => {
    const list = onMenu.map(([id]) => id)
    const target = index + dir
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    const changes = {}
    list.forEach((id, i) => {
      changes[`${id}/order`] = i + 1
    })
    update(ref(rtdb, 'pizzas'), changes).catch(() => setError("The new order didn't save. Try again."))
  }

  const addPizza = async (fields) => {
    const all = pizzas || {}
    let id = keyFor(fields.name)
    for (let n = 2; all[id]; n += 1) id = `${keyFor(fields.name)}-${n}`
    await update(ref(rtdb, `pizzas/${id}`), { ...fields, active: false, special: false, order: onMenu.length + 1 })
    setEditing(null)
  }

  if (loading || (user && isAdmin === null)) return <div className="p-8 text-gray-500">Loading…</div>
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-8 grid gap-4">
        <h1 className="text-2xl font-bold">Menu</h1>
        <p className="text-gray-600">
          {user ? `${user.email} isn't on the menu admin list yet.` : 'Sign in with Google to edit the menu.'}
        </p>
        {!user && (
          <button type="button" onClick={signInWithGoogle} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg">
            Sign in with Google
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 grid gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Menu</h1>
        <button type="button" onClick={() => setEditing('new')} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg">
          Add a pizza
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {editing === 'new' && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Editor pizza={{}} onSave={addPizza} onCancel={() => setEditing(null)} />
          <p className="text-xs text-gray-500 mt-2 text-left">New pizzas start off the menu. Turn on "On the menu" when it's ready.</p>
        </div>
      )}
      {pizzas === null ? (
        <p className="text-gray-500">Loading the menu…</p>
      ) : (
        <>
          <section className="grid gap-2">
            <h2 className="text-left font-semibold text-gray-700">On the menu ({onMenu.length})</h2>
            <p className="text-left text-sm text-gray-500">The order here is the order on the website.</p>
            <ul className="grid gap-2">
              {onMenu.map(([id, p], i) => (
                <PizzaRow
                  key={id}
                  id={id}
                  pizza={p}
                  editing={editing}
                  setEditing={setEditing}
                  move={(dir) => move(i, dir)}
                  canMoveUp={i > 0}
                  canMoveDown={i < onMenu.length - 1}
                />
              ))}
            </ul>
          </section>
          <section className="grid gap-2">
            <h2 className="text-left font-semibold text-gray-700">Off the menu ({offMenu.length})</h2>
            <ul className="grid gap-2">
              {offMenu.map(([id, p]) => (
                <PizzaRow key={id} id={id} pizza={p} editing={editing} setEditing={setEditing} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

export default MenuAdmin
