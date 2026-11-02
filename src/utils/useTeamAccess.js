import useTeamRole from './useTeamRole'

// Team tools by role (see useTeamRole for the one list that decides it).
export const TEAM_TOOLS = [
  { key: 'menu', roles: ['admin'], name: 'Menu manager', href: '/admin/menu', blurb: 'Edit the pizzas and photos on the website.' },
  { key: 'planner', roles: ['admin', 'staff'], name: 'Dough planner', href: '/planner', blurb: 'Plan dough, shopping and prep for upcoming services.' },
  { key: 'events', roles: ['admin'], name: 'Events and quotes', href: '/events', blurb: 'Inquiries, quotes, bookings, weather and dough reminders.' },
  { key: 'wrapup', roles: ['admin'], name: 'Wrap up', href: '/events/wrapup', blurb: 'Log an event or prep day to the money tracker.' },
  {
    key: 'admin',
    roles: ['admin'],
    name: 'Business dashboard',
    href: 'https://claude.ai/artifact/K9KEwBzUztUTbSTAroYikx',
    blurb: 'Opens on claude.ai. Each admin needs it shared with their account there.',
    external: true,
  },
]

const useTeamAccess = () => {
  const { user, loading, role } = useTeamRole()
  const tools = role ? TEAM_TOOLS.filter((t) => t.roles.includes(role)) : []
  return { user, loading, role, tools }
}

export default useTeamAccess
