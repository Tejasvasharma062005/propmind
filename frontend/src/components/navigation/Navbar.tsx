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
  ArrowUpRight,
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
      d="M7 29V17C7 10.9249 11.9249 6 18 6C24.0751 6 29 10.9249 29 17V29"
      stroke="#C3A66B"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M12.5 29V18.5C12.5 15.4624 14.9624 13 18 13C21.0376 13 23.5 15.4624 23.5 18.5V29"
      stroke="#F8F4E9"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line x1="5" y1="29" x2="31" y2="29" stroke="#C3A66B" strokeWidth="1.8" strokeLinecap="round" />
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
    { label: 'Home', to: '/' },
    { label: 'Listings', to: '/listings' },
    { label: 'Properties', to: '/properties' },
    {
      label: 'Sell',
      to: isAuthenticated ? '/dashboard/listings/new' : '/login?redirect=/dashboard/listings/new',
    },
    {
      label: 'Projects',
      to: isAuthenticated ? '/dashboard/ventures' : '/listings?listing_type=SALE',
    },
    {
      label: 'Verification',
      to: isAuthenticated ? '/dashboard/verification' : '/properties?verified=true',
    },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300 bg-[#171715]/95 backdrop-blur-md text-[#F8F4E9] border-b',
        isScrolled ? 'border-[#494431]' : 'border-white/10'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-4">
          {/* Left: PropMind Architectural Crest & Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <PropMindCrest className="w-8 h-8 transition-transform duration-200 group-hover:scale-105" />
              <span className="text-xl sm:text-2xl font-serif font-semibold tracking-tight text-[#F8F4E9] group-hover:text-[#C3A66B] transition-colors">
                PropMind
              </span>
            </Link>
          </div>

          {/* Center: Minimal Editorial Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-normal tracking-wide text-[#D8C9A7]">
            {navLinks.map((link) => {
              const basePath = link.to.split('?')[0];
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname === basePath || location.pathname.startsWith(basePath + '/');
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={cn(
                    'py-1 transition-colors hover:text-[#F8F4E9]',
                    isActive ? 'text-[#C3A66B] font-medium' : 'text-[#D8C9A7]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search Toggle & Pill CTA */}
          <div className="hidden md:flex items-center gap-3">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="relative w-56 animate-in fade-in">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-[#C3A66B]" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setSearchOpen(false)}
                  placeholder="Search Indore..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white/10 text-[#F8F4E9] border border-[#C3A66B]/50 rounded-full focus:outline-none focus:ring-1 focus:ring-[#C3A66B] placeholder:text-[#D8C9A7]/60"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2.5 top-2 text-[#D8C9A7] hover:text-[#F8F4E9]"
                  aria-label="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full text-[#D8C9A7] hover:text-[#C3A66B] hover:bg-white/5 transition-colors"
                aria-label="Search properties"
                title="Search Indore properties"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 pl-3.5 pr-1.5 py-1.5 rounded-full border border-[#494431] bg-[#24231F] hover:border-[#C3A66B] text-[#F8F4E9] transition-colors focus:outline-none"
                >
                  <span className="text-xs font-medium tracking-wide max-w-[115px] truncate">
                    {user.name || 'My Account'}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-[#F8F4E9] text-[#171715] flex items-center justify-center">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2.5 w-60 bg-[#F8F4E9] text-[#373124] rounded-2xl shadow-xl border border-[#D8C9A7] py-2 z-50 animate-in fade-in-50 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-[#D8C9A7]/70 flex items-center gap-2.5">
                      <Avatar name={user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-serif font-bold text-[#373124] truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-[#494431] truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="px-4 py-1.5 border-b border-[#D8C9A7]/70 flex flex-wrap gap-1">
                      {user.roles?.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] bg-[#F3EBD8] text-[#373124] border border-[#D8C9A7] px-2 py-0.5 rounded-full font-semibold"
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#373124] hover:bg-[#F3EBD8] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#494431]" />
                      Dashboard
                    </Link>

                    <Link
                      to="/dashboard/listings/new"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#373124] hover:bg-[#F3EBD8] transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-[#494431]" />
                      Create Listing
                    </Link>

                    <Link
                      to="/dashboard/verification"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#373124] hover:bg-[#F3EBD8] transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#494431]" />
                      Property Passports
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-800 hover:bg-rose-50 transition-colors text-left border-t border-[#D8C9A7]/70 mt-1 pt-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-700" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-medium text-[#D8C9A7] hover:text-[#F8F4E9] px-2 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 pl-4 pr-1.5 py-1.5 rounded-full border border-[#494431] bg-[#24231F] hover:border-[#C3A66B] text-xs font-medium text-[#F8F4E9] transition-all"
                >
                  <span>Get Started</span>
                  <span className="w-6 h-6 rounded-full bg-[#F8F4E9] text-[#171715] flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#F8F4E9] hover:text-[#C3A66B] rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#494431] bg-[#171715] px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#C3A66B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indore properties..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white/10 text-[#F8F4E9] border border-[#494431] rounded-full focus:outline-none focus:ring-1 focus:ring-[#C3A66B] placeholder:text-[#D8C9A7]/60"
            />
          </form>

          <div className="flex flex-col space-y-1.5">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#F8F4E9] hover:text-[#C3A66B] hover:bg-white/5 rounded-xl flex items-center justify-between"
              >
                <span>{item.label}</span>
                <ArrowUpRight className="w-4 h-4 opacity-60" />
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="pt-2 border-t border-[#494431] space-y-1.5">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-[#C3A66B] hover:bg-white/5 rounded-xl flex items-center gap-2"
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
              <div className="pt-3 border-t border-[#494431] flex flex-col gap-2">
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
                    className="bg-[#C3A66B] text-[#171715] hover:bg-[#D8C9A7]"
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
