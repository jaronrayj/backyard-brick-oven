import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  ClipboardListIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  LogoutIcon,
} from '@heroicons/react/outline'
import logo from '../../assets/BrickovenLogo.png'
import useTeamAccess from '../../utils/useTeamAccess'
import { logout } from '../../utils/firebase'
import Notifications from '../Notifications'
import { markTeamBrowser } from '../../utils/track'
import { offerTeamApp } from '../../utils/teamApp'

// The team bar on every team page: logo, a link to the website, notifications bell, sign out, and
// one tab per tool. Phones get the tabs along the bottom of the screen;
// wider screens get them in the bar.
const ICONS = {
  planner: ClipboardListIcon,
  events: CalendarIcon,
  menu: BookOpenIcon,
  money: CurrencyDollarIcon,
  admin: ChartBarIcon,
}

// The tool whose link is the longest match for this path.
const currentKey = (tools, path) =>
  tools
    .filter((t) => !t.external && (path === t.href || path.startsWith(`${t.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.key

// In-app tools use the router (no page reload); the dashboard opens in a new tab.
export const ToolLink = ({ tool, children, ...rest }) =>
  tool.external ? (
    <a href={tool.href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  ) : (
    <Link to={tool.href} {...rest}>
      {children}
    </Link>
  )

const TeamNav = () => {
  const path = useLocation().pathname.replace(/\/$/, '') || '/'
  const { user, role, tools } = useTeamAccess()
  const current = currentKey(tools, path)
  const showTabs = tools.length > 1
  // A team member's browser: leave it out of the visitor counts.
  React.useEffect(() => {
    if (role) {
      markTeamBrowser()
      offerTeamApp()
    }
  }, [role])

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to={tools[0]?.href || '/team'} className="flex items-center gap-2 shrink-0" aria-label="Team home">
            <img src={logo} alt="" className="h-8" />
            <span className="font-bold text-gray-900">BYBO Team</span>
          </Link>
          {showTabs && (
            <nav className="hidden sm:flex items-center gap-1 ml-4" aria-label="Team tools">
              {tools.map((t) => (
                <ToolLink
                  key={t.key}
                  tool={t}
                  aria-current={current === t.key ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    current === t.key ? 'bg-amber-100 text-amber-900' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.name}
                  {t.external && <span aria-hidden="true"> ↗</span>}
                </ToolLink>
              ))}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              title="Go to the main website"
            >
              <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
              <span>Website</span>
            </Link>
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
              <ToolLink
                key={t.key}
                tool={t}
                aria-current={on ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${on ? 'text-amber-700' : 'text-gray-500'}`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                {t.name}
              </ToolLink>
            )
          })}
        </nav>
      )}
    </>
  )
}

export default TeamNav
