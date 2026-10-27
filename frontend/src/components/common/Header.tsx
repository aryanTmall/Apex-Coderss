import React, { useState } from 'react';
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import {
  Search,
  Globe,
  Menu,
  ShieldCheck,
  PhoneCall,
  PlusCircle,
  Radio,
  Banknote,
  Users,
  Award,
  ShieldAlert,
  Map as MapIcon,
  Lock,
  ExternalLink
} from 'lucide-react';

interface HeaderProps {
  onSearch?: (term: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onToggleMobileMenu }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicMode = location.pathname.startsWith('/public') ||
    location.pathname === '/emergency' ||
    location.pathname === '/app/report' ||
    location.pathname === '/app/track' ||
    location.pathname === '/';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    if (term.startsWith('REP-') || term.startsWith('CIV-')) {
      navigate(`/app/track/${term}`);
    } else if (onSearch) {
      onSearch(term);
    } else {
      navigate(`/app?search=${encodeURIComponent(term)}`);
    }
  };

  const publicNavItems = [
    { to: '/public', label: 'Citizen Home', end: true },
    { to: '/app/report', label: 'Report Issue' },
    { to: '/app/track', label: 'Track' },
    { to: '/public/map', label: 'Map' },
    { to: '/public/intelligence', label: 'News Feed' },
    { to: '/emergency', label: 'Emergency 112' },
    { to: '/public/funds', label: 'Funds' },
    { to: '/public/participation', label: 'Ward Voting' },
    { to: '/public/rewards', label: 'Rewards' },
    { to: '/public/confidential-report', label: 'Whistleblower' },
  ];

  return (
    <header className="fixed top-6 left-0 md:left-64 right-0 h-14 bg-surface-1/90 backdrop-blur-xl z-30 flex items-center justify-between px-3 md:px-6 border-b border-white/5 shadow-sm gap-2">
      {/* Mobile Drawer Hamburger Button */}
      {onToggleMobileMenu && (
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg bg-surface-2 text-text-muted hover:text-white border border-white/10 shrink-0"
          title="Open Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Public Citizen Navigation Deck (Horizontal Scrollable Pills) */}
      {isPublicMode ? (
        <div className="flex items-center gap-1 overflow-x-auto py-1 pr-2 custom-scrollbar flex-1">
          {publicNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                px-2.5 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-all shrink-0
                ${isActive
                  ? 'bg-civic-blue text-white font-bold shadow-sm'
                  : 'text-text-muted hover:text-white hover:bg-surface-2'
                }
              `}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : (
        /* Government Search Bar */
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cases by Tracking ID (REP-..., CIV-...), geofence, or keywords..."
              className="w-full h-9 pl-9 pr-4 bg-night text-text-primary placeholder:text-text-muted text-xs rounded-inner border border-white/10 focus:outline-none focus:border-civic-blue transition-colors font-mono"
            />
          </div>
        </form>
      )}

      {/* Right Telemetry Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Stream Live Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-2 border border-white/5 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-verified-teal animate-ping"></span>
          <span className="text-verified-teal">MESH LIVE</span>
          <span className="text-text-muted text-[10px]">142ms</span>
        </div>

        {/* Bilingual Switcher */}
        <button
          type="button"
          onClick={() => setLanguage(l => l === 'EN' ? 'HI' : 'EN')}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-inner bg-surface-2 border border-white/5 text-text-muted hover:text-text-primary text-xs font-mono transition-colors"
          title="Switch Display Telemetry Language"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{language === 'EN' ? 'EN / हि' : 'हिन्दी'}</span>
        </button>

        {/* Switch to Government Login if in public mode */}
        {isPublicMode && (
          <Link
            to="/government/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-muted hover:text-white transition-all shrink-0"
          >
            <Lock className="w-3 h-3 text-civic-blue" />
            <span className="hidden lg:inline">Gov Login</span>
            <span className="lg:hidden">OPS</span>
          </Link>
        )}
      </div>
    </header>
  );
};
