import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Bell,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export const PropMindCrest: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M18 3L4 14.5V32H13.5V21.5H22.5V32H32V14.5L18 3Z"
      fill="#C9A96E"
      fillOpacity="0.92"
    />
    <path
      d="M18 7.5L8.5 15.5V29H12.5V19.5H23.5V29H27.5V15.5L18 7.5Z"
      stroke="#14251C"
      strokeWidth="1.6"
    />
  </svg>
);

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/properties');
    }
  };

  const navLinks = [
    { label: 'Properties', to: '/properties', hasCaret: true },
    { label: 'Buy', to: '/listings?listing_type=SALE', hasCaret: true },
    { label: 'Rent', to: '/listings?listing_type=RENT', hasCaret: true },
    {
      label: 'Sell',
      to: isAuthenticated ? '/dashboard/listings/new' : '/login?redirect=/dashboard/listings/new',
      hasCaret: true,
    },
    {
      label: 'Projects',
      to: isAuthenticated ? '/dashboard/ventures' : '/listings',
      hasCaret: true,
    },
    {
      label: 'Verification',
      to: isAuthenticated ? '/dashboard/verification' : '/properties?verified=true',
      hasCaret: false,
    },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300 bg-[#14231B]/95 backdrop-blur-md text-[#FAF7F2] border-b',
        isScrolled ? 'shadow-md border-white/15' : 'border-white/10'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-4">
          {/* Left: PropMind Gold Crest & Editorial Serif Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <PropMindCrest className="w-8 h-8 transition-transform duration-200 group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="text-2xl font-serif font-semibold tracking-tight text-[#FAF7F2] group-hover:text-[#C9A96E] transition-colors">
                  PropMind
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Editorial Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#E6E0D3]">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to !== '/' && location.pathname.startsWith(link.to.split('?')[0]));
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={cn(
                    'inline-flex items-center gap-1 py-1 transition-colors hover:text-[#C9A96E]',
                    isActive && 'text-[#C9A96E]'
                  )}
                >
                  <span>{link.label}</span>
                  {link.hasCaret && <ChevronDown className="w-3.5 h-3.5 opacity-75" />}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search Toggle, Notification Bell, & My Account Pill */}
          <div className="hidden md:flex items-center gap-3">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="relative w-60 animate-in fade-in">
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#C9A96E]" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setSearchOpen(false)}
                  placeholder="Search Indore localities..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white/10 text-[#FAF7F2] border border-[#C9A96E]/50 rounded-full focus:outline-none focus:ring-1 focus:ring-[#C9A96E] placeholder:text-[#C5D7CB]/60"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2.5 top-2 text-[#E6E0D3]/70 hover:text-white"
                  aria-label="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full text-[#E6E0D3] hover:text-[#C9A96E] hover:bg-white/5 transition-colors"
                aria-label="Search properties"
                title="Search Indore properties"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="p-2 rounded-full text-[#E6E0D3] hover:text-[#C9A96E] hover:bg-white/5 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
            </Link>

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/60 bg-white/5 hover:bg-white/10 text-[#FAF7F2] transition-colors focus:outline-none"
                >
                  <UserIcon className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-xs font-medium tracking-wide max-w-[115px] truncate">
                    {user.name || 'My Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#C9A96E]" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2.5 w-60 bg-[#FAF7F2] text-[#1C2420] rounded-2xl shadow-xl border border-[#D5CCB9] py-2 z-50 animate-in fade-in-50 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-[#E6E0D3] flex items-center gap-2.5">
                      <Avatar name={user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-serif font-bold text-[#1C2420] truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-[#5A625D] truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="px-4 py-1.5 border-b border-[#E6E0D3] flex flex-wrap gap-1">
                      {user.roles?.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] bg-[#E6EDE8] text-[#1B3126] px-2 py-0.5 rounded-full font-semibold"
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1C2420] hover:bg-[#EFEAE0] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#1B3126]" />
                      Dashboard
                    </Link>

                    <Link
                      to="/dashboard/listings/new"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1C2420] hover:bg-[#EFEAE0] transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-[#1B3126]" />
                      Create Listing
                    </Link>

                    <Link
                      to="/dashboard/verification"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1C2420] hover:bg-[#EFEAE0] transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#1B3126]" />
                      Property Passports
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 transition-colors text-left border-t border-[#E6E0D3] mt-1 pt-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="text-xs font-medium text-[#E6E0D3] hover:text-[#C9A96E] px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C9A96E]/70 bg-white/5 hover:bg-[#C9A96E] hover:text-[#14231B] text-xs font-medium text-[#FAF7F2] transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>My Account</span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#FAF7F2] hover:text-[#C9A96E] rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#14231B] px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#C9A96E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indore properties..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white/10 text-[#FAF7F2] border border-white/15 rounded-full focus:outline-none focus:ring-1 focus:ring-[#C9A96E] placeholder:text-white/50"
            />
          </form>

          <div className="flex flex-col space-y-1.5">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#FAF7F2] hover:text-[#C9A96E] hover:bg-white/5 rounded-xl flex items-center justify-between"
              >
                <span>{item.label}</span>
                <ChevronDown className="w-4 h-4 opacity-60 -rotate-90" />
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-[#C9A96E] hover:bg-white/5 rounded-xl flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-rose-300 hover:bg-white/5 rounded-xl text-left flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" fullWidth size="md">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="primary"
                    fullWidth
                    size="md"
                    className="bg-[#C9A96E] text-[#14231B] hover:bg-[#b89659]"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
