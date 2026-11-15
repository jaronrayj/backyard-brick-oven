import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import FollowUp from './FollowUp'

const day = 86400000
const twoDaysAgo = Date.now() - 2 * day
const event = {
  name: 'Becca Jenkins',
  status: 'inquiry',
  email: 'b@example.com',
  history: [
    { at: twoDaysAgo, type: 'created', text: 'Inquiry came in from the website' },
    { at: Date.now() - 3600000, type: 'contact', text: 'Talked or texted' },
  ],
}
const pad = (n) => String(n).padStart(2, '0')
const localDay = (ms) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

test('logging something that happened days ago', () => {
  const onLog = jest.fn()
  render(<FollowUp event={event} onLog={onLog} onEdit={() => {}} />)
  fireEvent.change(screen.getAllByLabelText('When it happened')[0], { target: { value: localDay(twoDaysAgo) } })
  fireEvent.click(screen.getByText('+ Talked or texted'))
  const line = onLog.mock.calls[0][0]
  expect(line).toMatchObject({ type: 'contact', text: 'Talked or texted' })
  expect(localDay(line.at)).toBe(localDay(twoDaysAgo))
  // Back to today: logged now.
  fireEvent.click(screen.getByText('back to today'))
  fireEvent.click(screen.getByText('+ They replied'))
  expect(Math.abs(onLog.mock.calls[1][0].at - Date.now())).toBeLessThan(5000)
})

test('editing a line: when it happened and what it says', () => {
  const onEdit = jest.fn()
  render(<FollowUp event={event} onLog={() => {}} onEdit={onEdit} />)
  fireEvent.click(screen.getByLabelText('Edit: Talked or texted'))
  fireEvent.change(screen.getByLabelText('When it happened', { selector: 'input[type="datetime-local"]' }), { target: { value: '2026-11-10T15:30' } })
  fireEvent.change(screen.getByLabelText('What happened'), { target: { value: 'Called her, she wants a tasting' } })
  fireEvent.click(screen.getByText('Save'))
  const [old, next] = onEdit.mock.calls[0]
  expect(old.text).toBe('Talked or texted')
  expect(next).toMatchObject({ type: 'contact', text: 'Called her, she wants a tasting', at: new Date('2026-11-10T15:30').getTime() })
})

test('deleting a line asks first', () => {
  const onEdit = jest.fn()
  render(<FollowUp event={event} onLog={() => {}} onEdit={onEdit} />)
  fireEvent.click(screen.getByLabelText('Edit: Talked or texted'))
  fireEvent.click(screen.getByText('Delete…'))
  expect(onEdit).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Delete'))
  expect(onEdit.mock.calls[0][1]).toBe(null)
})

test("only lines saved on the event can be edited", () => {
  // No saved 'created' line: the timeline makes one up from createdAt, which isn't editable.
  const e = { ...event, createdAt: twoDaysAgo, history: [{ at: Date.now() - 3600000, type: 'contact', text: 'Talked or texted' }] }
  render(<FollowUp event={e} onLog={() => {}} onEdit={() => {}} />)
  expect(screen.getByText(/Added to the tracker|Inquiry came in/)).toBeInTheDocument()
  expect(screen.getAllByText('Edit')).toHaveLength(1)
})
