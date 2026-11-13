// Team pages get the team bar instead of the website menu. Kept apart from
// useTeamAccess so the public pages can check a path without loading it.
export const TEAM_PATHS = ['/team', '/planner', '/events', '/admin', '/money']
export const isTeamPath = (path) => TEAM_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
