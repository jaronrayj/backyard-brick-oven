import React from 'react'
import { logout, signInWithGoogle } from '../../utils/firebase'
import useTeamAccess from '../../utils/useTeamAccess'
import { PageHeader, TeamPage, ui } from '../../components/TeamPage'
import { ToolLink } from '../../components/TeamNav'

// Team sign-in, and a list of the tools for anyone who lands here. Once signed
// in, the team bar gets you between tools.
const Team = () => {
  const { user, loading, tools } = useTeamAccess()

  return (
    <TeamPage>
      <PageHeader title="Team" />

      {loading && <p className="text-gray-500">Loading…</p>}

      {!loading && !user && (
        <div className={`${ui.card} space-y-3`}>
          <p className="text-gray-700">Sign in with your Google account to open the team tools.</p>
          <button type="button" onClick={signInWithGoogle} className={ui.btnPrimary}>
            Sign in with Google
          </button>
        </div>
      )}

      {!loading && user && (
        <>
          {tools.length === 0 ? (
            <p className={`${ui.card} text-gray-700`}>
              {user.email} isn't on any team list yet. Ask Jaron to add it, then reload this page.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {tools.map((tool) => (
                <li key={tool.key}>
                  <ToolLink
                    tool={tool}
                    className={`${ui.card} block h-full hover:border-amber-500`}
                  >
                    <span className="block text-lg font-semibold text-gray-900">
                      {tool.name}
                      {tool.external && <span aria-hidden="true"> ↗</span>}
                    </span>
                    <span className="block text-sm text-gray-600">{tool.blurb}</span>
                  </ToolLink>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-gray-500">
            Signed in as {user.email}.{' '}
            <button type="button" onClick={logout} className="underline hover:text-gray-900">
              Sign out
            </button>
          </p>
        </>
      )}
    </TeamPage>
  )
}

export default Team
