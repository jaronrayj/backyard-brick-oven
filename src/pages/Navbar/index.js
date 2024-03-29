import React, { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db, logout } from '../../utils/firebase'
import { Fragment } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { BellIcon, MenuIcon, XIcon } from '@heroicons/react/outline'
import { collection, query, where, addDoc, getDocs } from 'firebase/firestore'
import { isSiteReadyForOrders } from '../App/index'
import logo from '../../assets/BrickovenLogo.png'

const navigation = [
  { name: 'Home', href: '/', current: true },
  { name: 'Order', href: '/order', current: false },
  // { name: "About Me", href: "#", current: false },
]

const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

const Navbar = () => {
  const [user, loading, error] = useAuthState(auth)
  const [name, setName] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [dbUser, setDbUser] = useState()

  const fetchUser = async () => {
    try {
      const q = query(collection(db, 'users'), where('uid', '==', user?.uid))
      const doc = await getDocs(q)
      const data = doc.docs[0].data()
      setDbUser(data)
    } catch (err) {
      console.error(err)
    }
  }
  useEffect(() => {
    if (loading) return
    user && setName(user.displayName)
    !dbUser && fetchUser()
    if (dbUser && navigation.length < 3 && !loaded) {
      dbUser.role === 'admin' &&
        navigation.push({ name: 'Admin', href: '/admin', current: false })
      setLoaded(true)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, dbUser, navigation, loaded])

  return (
    <Disclosure as="nav" className="bg-yellow-500">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between h-16">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <img
                  className="block h-14 mr-4"
                  src={logo}
                  alt="Backyard Brick Oven"
                />
                <h2 className="text-xl font-mono">Backyard Brick Oven</h2>
              </div>
              <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                <div className="hidden sm:block sm:ml-6">
                  <div className="flex space-x-4">
                    <img
                      className="block h-14"
                      src={logo}
                      alt="Backyard Brick Oven"
                    />
                    <div className="m-auto">
                      <span className="text-3xl font-mono h-14">
                        Backyard Brick Oven
                      </span>
                    </div>
                    {isSiteReadyForOrders &&
                      navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                            'px-3 py-2 rounded-md text-sm font-medium'
                          )}
                          aria-current={item.current ? 'page' : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                  </div>
                </div>
              </div>
              {isSiteReadyForOrders && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  <button
                    type="button"
                    className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  {/* Profile dropdown */}
                  <Menu as="div" className="ml-3 relative">
                    {name ? (
                      <>
                        <div>
                          <Menu.Button className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                            <span className="sr-only">Open user menu</span>
                            <span className="text-white font-bold">{name}</span>
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                              {({ active }) => (
                                <a
                                  href="/settings"
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700'
                                  )}
                                >
                                  Settings
                                </a>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <a
                                  href="/"
                                  onClick={logout}
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700'
                                  )}
                                >
                                  Sign out
                                </a>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </>
                    ) : (
                      <a className="text-white font-bold" href="/login">
                        Login
                      </a>
                    )}
                  </Menu>
                </div>
              )}
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'block px-3 py-2 rounded-md text-base font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}

export default Navbar
