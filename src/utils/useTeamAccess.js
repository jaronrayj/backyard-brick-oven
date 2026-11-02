import useTeamRole from './useTeamRole'

// Team tools by role (see useTeamRole for the one list that decides it).
// Order here is the order of the team tabs.
export const TEAM_TOOLS = [
  { key: 'planner', roles: ['admin', 'staff'], name: 'Planner', href: '/planner', blurb: 'Dough, shopping and prep for upcoming services.' },
  { key: 'events', roles: ['admin'], name: 'Events', href: '/events', blurb: 'Inquiries, quotes and bookings.' },
  { key: 'wrapup', roles: ['admin'], name: 'Wrap-up', href: '/events/wrapup', blurb: 'Log an event or prep day to the money tracker.' },
  { key: 'menu', roles: ['admin'], name: 'Menu', href: '/admin/menu', blurb: 'The pizzas and photos on the website.' },
  {
    key: 'admin',
    roles: ['admin'],
    name: 'Dashboard',
    href: 'https://claude.ai/artifact/K9KEwBzUztUTbSTAroYikx',
    blurb: 'Opens on claude.ai. Each admin needs it shared with their account there.',
    external: true,
  },
]

// Team pages get the team bar instead of the website menu.
export const TEAM_PATHS = ['/team', '/planner', '/events', '/admin']
export const isTeamPath = (path) => TEAM_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

const useTeamAccess = () => {
  const { user, loading, role } = useTeamRole()
  const tools = role ? TEAM_TOOLS.filter((t) => t.roles.includes(role)) : []
  return { user, loading, role, tools }
}

export default useTeamAccess
