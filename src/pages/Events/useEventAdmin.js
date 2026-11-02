import useTeamRole from '../../utils/useTeamRole'

// Events and wrap-ups are for admins. access: null while checking, true, or 'denied'.
const useEventAdmin = () => {
  const { user, loading, role } = useTeamRole()
  return { user, loading, access: loading || !user ? null : role === 'admin' ? true : 'denied' }
}

export default useEventAdmin
