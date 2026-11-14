import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { onTabHome } from './tabHome'
import { ToolLink } from '../components/TeamNav'

jest.mock('../utils/firebase', () => ({ auth: {}, logout: () => {} }))
jest.mock('../utils/db', () => ({ db: {} }))

const Where = () => <p data-testid="path">{useLocation().pathname}</p>
const tool = { key: 'events', name: 'Events', href: '/events' }

beforeEach(() => {
  window.scrollTo = jest.fn()
})

test('tapping the tab you are on: back to its main view and the top, no navigation', () => {
  const heard = jest.fn()
  const off = onTabHome('events', heard)
  const other = jest.fn()
  const offOther = onTabHome('planner', other)
  render(
    <MemoryRouter initialEntries={['/events?event=abc']}>
      <ToolLink tool={tool} aria-current="page">
        Events
      </ToolLink>
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Events'))
  expect(heard).toHaveBeenCalledTimes(1)
  expect(other).not.toHaveBeenCalled()
  expect(window.scrollTo).toHaveBeenCalled()
  off()
  offOther()
})

test('tapping another tab just goes there', () => {
  const heard = jest.fn()
  const off = onTabHome('events', heard)
  render(
    <MemoryRouter initialEntries={['/planner']}>
      <ToolLink tool={tool}>Events</ToolLink>
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Events'))
  expect(heard).not.toHaveBeenCalled()
  expect(screen.getByTestId('path')).toHaveTextContent('/events')
  off()
})
