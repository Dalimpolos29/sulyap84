import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProfileContext } from '@/contexts/ProfileContext'
import { 
  Home,
  Users,
  Image as ImageIcon,
  Phone,
  Search,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const { profile, loading: profileLoading } = useProfileContext()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Determine if the user is authenticated based on profile data
  const isAuthenticated = !!profile && !profileLoading

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      current: pathname === '/'
    },
    {
      name: 'Members Directory',
      href: '/members',
      icon: Users,
      current: pathname === '/members'
    },
    {
      name: 'Gallery',
      href: '/gallery',
      icon: ImageIcon,
      current: pathname.startsWith('/gallery'),
      dropdown: [
        { name: 'Photos', href: '/gallery/photos' },
        { name: 'Sulyap', href: '/gallery/sulyap' }
      ]
    },
    {
      name: 'Contact',
      href: '/contact',
      icon: Phone,
      current: pathname.startsWith('/contact'),
      dropdown: [
        { name: 'Contact Us', href: '/contact' },
        { name: 'Support', href: '/contact/support' }
      ]
    }
  ]

  if (!isAuthenticated) return null

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-[57px] z-40 font-serif">
      <div className="w-full max-w-[1400px] mx-auto">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between px-4 sm:px-6 md:px-8 h-12">
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'text-[#7D1A1D] bg-[#7D1A1D]/5'
                      : 'text-gray-700 hover:text-[#7D1A1D] hover:bg-[#7D1A1D]/5'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                  {item.dropdown && (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Link>
                
                {/* Dropdown Menu */}
                {item.dropdown && (
                  <div className="absolute left-0 mt-1 w-48 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {item.dropdown.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#7D1A1D]/5 hover:text-[#7D1A1D]"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex items-center">
            <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-64' : 'w-40'}`}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setIsSearchOpen(false)}
                className="w-full bg-gray-100 text-gray-900 text-sm rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7D1A1D]/20 transition-all duration-300"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 h-12">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-[#7D1A1D] focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Mobile Search */}
            <div className="relative flex-1 max-w-[200px] ml-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 text-gray-900 text-sm rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7D1A1D]/20"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`${
              isMobileMenuOpen ? 'max-h-96' : 'max-h-0'
            } overflow-hidden transition-all duration-300 ease-in-out bg-white border-t border-gray-200`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                      item.current
                        ? 'text-[#7D1A1D] bg-[#7D1A1D]/5'
                        : 'text-gray-700 hover:text-[#7D1A1D] hover:bg-[#7D1A1D]/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                  {item.dropdown && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-[#7D1A1D] hover:bg-[#7D1A1D]/5"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 