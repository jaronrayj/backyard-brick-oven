import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import Events from './index'

// Stand-ins: an admin, two events, nothing written anywhere.
jest.mock('./useEventAdmin', () => () => ({ user: { email: 'a@b.com' }, loading: false, access: true }))
jest.mock('../../utils/db', () => ({ db: {} }))
jest.mock('../../utils/firebase', () => ({ signInWithGoogle: () => {}, auth: {} }))
jest.mock('../../components/TeamPage', () => {
  const ui = { input: '', btn: '', card: '', btnPrimary: '', btnQuiet: '' }
  return { ui, TeamPage: ({ children }) => <div>{children}</div>, PageHeader: ({ title, children }) => <div><h1>{title}</h1>{children}</div> }
})
const mockEvents = [
  { id: 'e1', name: 'Jeremy Beck', status: 'booked', date: '2026-11-21', history: [] },
  { id: 'e2', name: 'Becca Jenkins', status: 'inquiry', date: '2027-05-18', history: [] },
]
jest.mock('firebase/firestore', () => ({
  collection: () => ({}),
  doc: () => ({}),
  onSnapshot: (ref, next) => {
    // The events collection gets docs; the settings docs get "missing".
    if (ref && ref.__events) next({ docs: mockEvents.map((e) => ({ id: e.id, data: () => e })) })
    else next({ exists: () => false, data: () => undefined, docs: mockEvents.map((e) => ({ id: e.id, data: () => e })) })
    return () => {}
  },
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
  arrayUnion: (...a) => a,
  serverTimestamp: () => 0,
}))
jest.mock('firebase/functions', () => ({ getFunctions: () => ({}), httpsCallable: () => () => Promise.resolve({ data: {} }) }))

let goBack
const Back = () => {
  goBack = useNavigate()
  return null
}

test('opening an event adds a step: Back goes to the list', async () => {
  render(
    <MemoryRouter initialEntries={['/events']}>
      <Back />
      <Routes>
        <Route path="/events" element={<Events />} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.getByText('Becca Jenkins')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Becca Jenkins'))
  expect(await screen.findByRole('heading', { name: 'Becca Jenkins' })).toBeInTheDocument()
  act(() => goBack(-1))
  expect(await screen.findByText('Jeremy Beck')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Becca Jenkins' })).not.toBeInTheDocument()
})

test('a link straight to an event opens it; Cancel goes to the list', async () => {
  render(
    <MemoryRouter initialEntries={['/events?event=e1']}>
      <Routes>
        <Route path="/events" element={<Events />} />
      </Routes>
    </MemoryRouter>
  )
  expect(await screen.findByRole('heading', { name: 'Jeremy Beck' })).toBeInTheDocument()
  fireEvent.click(screen.getByText('Cancel'))
  expect(await screen.findByText('Becca Jenkins')).toBeInTheDocument()
})

test('an inquiry marked Contacted sits under Contacted with that tag', async () => {
  mockEvents[1].status = 'contacted'
  render(
    <MemoryRouter initialEntries={['/events']}>
      <Routes>
        <Route path="/events" element={<Events />} />
      </Routes>
    </MemoryRouter>
  )
  const row = screen.getByText('Becca Jenkins').closest('section')
  expect(row.querySelector('h2').textContent).toMatch(/^Contacted/)
  expect(screen.getAllByText('Contacted').length).toBeGreaterThan(1) // heading + tag
  mockEvents[1].status = 'inquiry'
})

test('Report moved to the team home: old links forward there; Emails stays', async () => {
  render(
    <MemoryRouter initialEntries={['/events?view=report']}>
      <Routes>
        <Route path="/events" element={<Events />} />
        <Route path="/admin/report" element={<p>Report page</p>} />
      </Routes>
    </MemoryRouter>
  )
  expect(await screen.findByText('Report page')).toBeInTheDocument()
})

test('the Events header has Emails and Pricing, not Report', () => {
  render(
    <MemoryRouter initialEntries={['/events']}>
      <Routes>
        <Route path="/events" element={<Events />} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.getByRole('button', { name: 'Emails' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Pricing' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Report' })).not.toBeInTheDocument()
})
