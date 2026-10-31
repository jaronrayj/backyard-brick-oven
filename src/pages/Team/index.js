import React from 'react'
import { logout, signInWithGoogle } from '../../utils/firebase'
import useTeamAccess from '../../utils/useTeamAccess'

const Team = () => {
  const { user, loading, tools } = useTeamAccess()

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-left">
      <h1 className="text-3xl font-mono mb-6">Team</h1>

      {loading && <p className="text-gray-500">Loading…</p>}

      {!loading && !user && (
        <>
          <p className="text-gray-700 mb-4">Sign in with your Google account to open the team tools.</p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700"
          >
            Sign in with Google
          </button>
        </>
      )}

      {!loading && user && (
        <>
          {tools.length === 0 ? (
            <p className="text-gray-700 mb-6">
              {user.email} isn't on any team list yet. Ask Jaron to add it, then reload this page.
            </p>
          ) : (
            <ul className="space-y-3 mb-6">
              {tools.map((tool) => (
                <li key={tool.key}>
                  <a
                    href={tool.href}
                    className="block border border-gray-300 rounded-md p-4 hover:border-gray-900 hover:bg-yellow-50"
                  >
                    <span className="block text-lg font-medium">{tool.name}</span>
                    <span className="block text-sm text-gray-600">{tool.blurb}</span>
                  </a>
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
    </div>
  )
}

export default Team
