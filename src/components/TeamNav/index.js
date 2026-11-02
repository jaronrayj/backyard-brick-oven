import React from 'react'
import {
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  LogoutIcon,
} from '@heroicons/react/outline'
import logo from '../../assets/BrickovenLogo.png'
import useTeamAccess from '../../utils/useTeamAccess'
import { logout } from '../../utils/firebase'
import Notifications from '../Notifications'

// The team bar on every team page: logo, notifications bell, sign out, and
// one tab per tool. Phones get the tabs along the bottom of the screen;
// wider screens get them in the bar.
const ICONS = {
  planner: ClipboardListIcon,
  events: CalendarIcon,
  wrapup: CheckCircleIcon,
  menu: BookOpenIcon,
  admin: ChartBarIcon,
}

// The tool whose link is the longest match for this path (/events/wrapup is Wrap-up, not Events).
const currentKey = (tools, path) =>
  tools
    .filter((t) => !t.external && (path === t.href || path.startsWith(`${t.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.key

const linkProps = (t) => (t.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})

const TeamNav = () => {
  const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') || '/' : '/'
  const { user, role, tools } = useTeamAccess()
  const current = currentKey(tools, path)
  const showTabs = tools.length > 1

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href={tools[0]?.href || '/team'} className="flex items-center gap-2 shrink-0" aria-label="Team home">
            <img src={logo} alt="" className="h-8" />
            <span className="font-bold text-gray-900">BYBO Team</span>
          </a>
          {showTabs && (
            <nav className="hidden sm:flex items-center gap-1 ml-4" aria-label="Team tools">
              {tools.map((t) => (
                <a
                  key={t.key}
                  href={t.href}
                  {...linkProps(t)}
                  aria-current={current === t.key ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    current === t.key ? 'bg-amber-100 text-amber-900' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.name}
                  {t.external && <span aria-hidden="true"> ↗</span>}
                </a>
              ))}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-1">
            {role === 'admin' && <Notifications />}
            {user && (
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                aria-label={`Sign out ${user.email}`}
                title={`Signed in as ${user.email}. Sign out`}
              >
                <LogoutIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      {showTabs && (
        <nav
          className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-200 grid"
          style={{ gridTemplateColumns: `repeat(${tools.length}, minmax(0, 1fr))`, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          aria-label="Team tools"
        >
          {tools.map((t) => {
            const Icon = ICONS[t.key] || ClipboardListIcon
            const on = current === t.key
            return (
              <a
                key={t.key}
                href={t.href}
                {...linkProps(t)}
                aria-current={on ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${on ? 'text-amber-700' : 'text-gray-500'}`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                {t.name}
              </a>
            )
          })}
        </nav>
      )}
    </>
  )
}

export default TeamNav
