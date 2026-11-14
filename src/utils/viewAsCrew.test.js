import { viewedRole } from './useTeamRole'

jest.mock('./firebase', () => ({ auth: {} }))
jest.mock('./db', () => ({ db: {} }))

test('an admin viewing as crew sees staff pages; nobody else changes', () => {
  expect(viewedRole('admin', 'staff')).toEqual({ role: 'staff', realRole: 'admin', viewingAsCrew: true })
  expect(viewedRole('admin', '')).toEqual({ role: 'admin', realRole: 'admin', viewingAsCrew: false })
  expect(viewedRole('staff', 'staff')).toEqual({ role: 'staff', realRole: 'staff', viewingAsCrew: false })
  expect(viewedRole(null, 'staff')).toEqual({ role: null, realRole: null, viewingAsCrew: false })
})
