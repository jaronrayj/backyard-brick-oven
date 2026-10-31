import React, { useEffect, useMemo, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { ref, onValue, update, remove } from 'firebase/database'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth, rtdb, signInWithGoogle } from '../../utils/firebase'
import { sortPizzas } from '../../utils'
import PhotoEditor from './PhotoEditor'

// Menu manager: the website menu lives in the Realtime Database at `pizzas/`,
// one entry per pizza: { name, toppings, img, active, special, order }.
// The homepage shows active pizzas; `special` ones go under "Special of the Week".
// Only people listed under `menuAdmins/` may edit (the database rules enforce it):
// each key is a Google account email with every '.' replaced by ',', value true.

// Database keys can't contain . $ # [ ] /
const keyFor = (name) => name.trim().replace(/[.$#[\]/]/g, '_') || 'pizza'

// The photo editor (PhotoEditor.js) crops and scales to 1200px wide before this.
const uploadPhoto = async (blob, name) => {
  const base = name.replace(/\.[^.]*$/, '').replace(/[^\w-]+/g, '_') || 'photo'
  const path = `pizzas/${Date.now()}-${base}.jpg`
  const snap = await uploadBytes(storageRef(getStorage(), path), blob, {
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000, immutable',
  })
  return getDownloadURL(snap.ref)
}

// Google Photos share links can change or stop working, so the server copies
// them into Storage (functions/menuPhotos.js) and the menu keeps the copy.
const isGooglePhoto = (url) => /^https:\/\/lh3\.googleusercontent\.com\//.test(url || '')
const importGooglePhoto = async (url) => {
  const res = await httpsCallable(getFunctions(), 'importMenuPhoto')({ url })
  return res.data.url
}

const MovePhotos = ({ list }) => {
  const [state, setState] = useState({ running: false, done: 0, failed: [] })
  const [showList, setShowList] = useState(false)
  if (!list.length && !state.failed.length) return null

  const run = async () => {
    setState({ running: true, done: 0, failed: [] })
    const failed = []
    let done = 0
    for (const [id, p] of list) {
      try {
        const url = await importGooglePhoto(p.img)
        // Keep the old link alongside, so a move can be undone by hand if needed.
        await update(ref(rtdb, `pizzas/${id}`), { img: url, imgGooglePhotos: p.img })
        done += 1
      } catch (e) {
        failed.push(p.name || id)
      }
      setState({ running: true, done, failed: [...failed] })
    }
    setState({ running: false, done, failed })
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left grid gap-2 text-sm">
      {list.length > 0 && (
        <>
          <p className="text-gray-800">
            {list.length} {list.length === 1 ? 'photo still loads' : 'photos still load'} from Google Photos, which can stop
            working. Move them to the site's own storage.{' '}
            <button type="button" className="underline text-gray-600" onClick={() => setShowList(!showList)}>
              {showList ? 'Hide list' : 'Show which'}
            </button>
          </p>
          {showList && <p className="text-gray-600 capitalize">{list.map(([, p]) => p.name).join(', ')}</p>}
          <div>
            <button type="button" disabled={state.running} onClick={run} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {state.running ? `Moving… ${state.done} done` : 'Move photos'}
            </button>
          </div>
        </>
      )}
      {!state.running && state.failed.length > 0 && (
        <p className="text-red-700">
          Couldn't move: {state.failed.join(', ')}. Open {state.failed.length === 1 ? 'that pizza' : 'those pizzas'} and upload a
          new photo.
        </p>
      )}
    </div>
  )
}

const Toggle = ({ on, label, onClick, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-pressed={on}
    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
      on ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-gray-300 text-gray-500'
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

  const [draft, setDraft] = useState(null)

  const pick = (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (file) setDraft(file)
  }

  const upload = async (blob) => {
    const name = draft.name
    setDraft(null)
    setBusy(true)
    setError('')
    try {
      setImg(await uploadPhoto(blob, name))
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
      let photo = img.trim()
      if (isGooglePhoto(photo)) {
        try {
          photo = await importGooglePhoto(photo)
        } catch (err) {
          setError("That Google Photos link couldn't be copied. Upload the photo instead.")
          setBusy(false)
          return
        }
      }
      await onSave({ name: name.trim(), toppings: toppings.trim(), img: photo })
    } catch (err) {
      setError("That didn't save. Make sure you're signed in as a menu admin.")
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-3 text-left">
      {draft && <PhotoEditor file={draft} onDone={upload} onCancel={() => setDraft(null)} />}
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
            {busy ? 'Uploading…' : 'Take or upload photo'}
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

const PizzaRow = ({ id, pizza, editing, setEditing, move, canMoveUp, canMoveDown, nextOrder }) => {
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
      <li className="p-4 bg-amber-50">
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

  const arrow = 'w-7 h-7 rounded-md border border-gray-200 bg-white text-sm text-gray-600 disabled:opacity-25'

  return (
    <li className="px-2 py-1.5 flex gap-2 items-center text-left">
      <button type="button" onClick={() => setEditing(id)} className="flex gap-2 items-center min-w-0 flex-1 text-left" title="Edit">
        {pizza.img ? (
          <img src={pizza.img} alt="" loading="lazy" className="h-10 w-10 object-cover rounded-md shrink-0" />
        ) : (
          <span className="h-10 w-10 rounded-md bg-gray-100 shrink-0" />
        )}
        <span className="min-w-0">
          <span className="block font-medium capitalize text-gray-900 truncate">{pizza.name}</span>
          <span className="block text-xs text-gray-500 truncate">{pizza.toppings || 'No toppings listed'}</span>
        </span>
      </button>
      {move ? (
        <>
          <Toggle on={!!pizza.special} label="Special" disabled={saving} onClick={() => set({ special: !pizza.special })} />
          <button type="button" aria-label={`Take ${pizza.name} off the menu`} title="Take off the menu" disabled={saving} onClick={() => set({ active: false, special: false })} className="w-7 h-7 rounded-md text-gray-400 hover:text-red-700 hover:bg-red-50 shrink-0">
            ✕
          </button>
          <button type="button" aria-label={`Move ${pizza.name} up`} disabled={!canMoveUp} onClick={() => move(-1)} className={arrow}>
            ↑
          </button>
          <button type="button" aria-label={`Move ${pizza.name} down`} disabled={!canMoveDown} onClick={() => move(1)} className={arrow}>
            ↓
          </button>
        </>
      ) : (
        <button type="button" disabled={saving} onClick={() => set({ active: true, order: nextOrder })} className="px-2 py-0.5 rounded-full text-xs font-medium border border-amber-600 text-amber-700 bg-white disabled:opacity-50 shrink-0">
          + Menu
        </button>
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
  const [showOff, setShowOff] = useState(false)
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  const offShown = term
    ? offMenu.filter(([, p]) => `${p.name || ''} ${p.toppings || ''}`.toLowerCase().includes(term))
    : offMenu

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
    <div className="max-w-2xl mx-auto px-4 py-6 grid gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Menu</h1>
        <button type="button" onClick={() => setEditing('new')} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg">
          Add a pizza
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {pizzas && <MovePhotos list={sorted.filter(([, p]) => isGooglePhoto(p.img))} />}
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
            <h2 className="text-left font-semibold text-gray-700">
              On the menu ({onMenu.length}) <span className="font-normal text-sm text-gray-500">· shown on the site in this order. Tap a pizza to edit it.</span>
            </h2>
            <ul className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
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
            <button type="button" onClick={() => setShowOff(!showOff)} className="text-left font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-xs text-gray-400">{showOff ? '▼' : '▶'}</span>
              Off the menu ({offMenu.length})
            </button>
            {showOff && (
              <>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a pizza"
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <ul className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
                  {offShown.map(([id, p]) => (
                    <PizzaRow key={id} id={id} pizza={p} editing={editing} setEditing={setEditing} nextOrder={onMenu.length + 1} />
                  ))}
                  {offShown.length === 0 && <li className="px-3 py-2 text-sm text-gray-500 text-left">No matches.</li>}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default MenuAdmin
