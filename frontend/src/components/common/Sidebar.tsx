import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  FileCheck2,
  MapPin,
  BrainCircuit,
  Flame,
  FileText,
  Building2,
  Scale,
  Banknote,
  Users,
  Award,
  ShieldAlert,
  SlidersHorizontal,
  Settings,
  Lock,
  LogOut,
  UserCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Radio,
  PlusCircle,
  Search,
  PhoneCall
} from 'lucide-react';
import { api } from '../../api/client';

interface SidebarProps {
  activeIncidentsCount?: number;
  mobileOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number | string;
  badgeColor?: string;
  restricted?: boolean;
  end?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeIncidentsCount = 0,
  mobileOpen = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = typeof window !== 'undefined' ? localStorage.getItem('civichelp_token') : null;
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('civichelp_user') : null;
  const user = userJson ? JSON.parse(userJson) : null;
  const isAuditorOrAdmin = user?.role === 'ADMIN' || user?.role === 'WHISTLEBLOWER_AUDITOR';

  // Collapsible section state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    operations: false,
    intelligence: false,
    vendors: false,
    programs: false,
    protected: false,
    tools: false,
  });

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    api.logout();
    navigate('/');
    if (onClose) onClose();
  };

  const navGroups: NavGroup[] = [
    {
      id: 'operations',
      title: 'Operations',
      items: [
        { to: '/government', icon: LayoutGrid, label: 'Overview & Queue', badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined, badgeColor: 'bg-alert-red/25 text-alert-red', end: true },
        { to: '/government/verification', icon: FileCheck2, label: 'Verification Desk' },
        { to: '/government/map', icon: MapPin, label: 'Operational Incident Map' },
      ],
    },
    {
      id: 'intelligence',
      title: 'Intelligence',
      items: [
        { to: '/government/intelligence', icon: Radio, label: 'Government Operational Feed', badge: 'LIVE', badgeColor: 'bg-alert-red/20 text-alert-red' },
        { to: '/government/hotspots', icon: Flame, label: 'Spatial Hotspots' },
        { to: '/government/audit', icon: FileText, label: 'Reports & Audit' },
      ],
    },
    {
      id: 'vendors',
      title: 'Departments & Vendors',
      items: [
        { to: '/government/departments', icon: Building2, label: 'Departments' },
        { to: '/government/contractors', icon: Scale, label: 'Contractors & SLAs' },
      ],
    },
    {
      id: 'programs',
      title: 'Citizen Programs',
      items: [
        { to: '/government/funds', icon: Banknote, label: 'Municipal Funds Mgmt' },
        { to: '/government/participation', icon: Users, label: 'Ward Voting Mgmt' },
        { to: '/government/rewards', icon: Award, label: 'Civic Rewards Admin' },
      ],
    },
    {
      id: 'protected',
      title: 'Protected Cases',
      items: [
        {
          to: '/government/whistleblower',
          icon: ShieldAlert,
          label: 'Whistleblower Review',
          restricted: !isAuditorOrAdmin,
          badge: isAuditorOrAdmin ? 'AIRGAP' : 'RESTRICTED',
          badgeColor: isAuditorOrAdmin ? 'bg-verified-teal/20 text-verified-teal' : 'bg-white/10 text-text-muted',
        },
      ],
    },
    {
      id: 'tools',
      title: 'Tools',
      items: [
        { to: '/government/simulation', icon: SlidersHorizontal, label: 'Simulation Deck' },
        { to: '/government/settings', icon: Settings, label: 'Settings & Access Mgmt' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-35 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-6 bottom-0 w-64 bg-surface-1 border-r border-white/5 z-40 flex flex-col justify-between p-3.5 shadow-2xl select-none transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
          {/* Brand Logo & Telemetry Status */}
          <div className="flex flex-col gap-1 pb-3 border-b border-white/5">
            <Link to="/government" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-inner bg-civic-blue/20 border border-civic-blue/40 flex items-center justify-center text-civic-blue shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm tracking-tight text-text-primary">CivicHelp</span>
                  <span className="px-1.5 py-0.2 rounded-badge text-[9px] font-mono bg-civic-blue/20 text-civic-blue font-bold">OPS</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted">NIGHT OPERATIONS v2.4</span>
              </div>
            </Link>
            <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-verified-teal font-medium">
                <span className="w-2 h-2 rounded-full bg-verified-teal animate-pulse" />
                SYS-ONLINE // FED-04
              </span>
              <span className="text-text-muted/60">GOV PORTAL</span>
            </div>
          </div>

          {/* Navigation Deck: Collapsible Groups */}
          <nav className="flex flex-col gap-3">
            {navGroups.map((group) => {
              const isCollapsed = collapsedGroups[group.id];

              return (
                <div key={group.id} className="flex flex-col">
                  {/* Group Header Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center justify-between px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-text-muted hover:text-white transition-colors"
                  >
                    <span>{group.title}</span>
                    {isCollapsed ? (
                      <ChevronRight className="w-3 h-3 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-text-muted" />
                    )}
                  </button>

                  {/* Group Nav Items */}
                  {!isCollapsed && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;

                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={onClose}
                            className={({ isActive }) => `
                              flex items-center justify-between px-2.5 py-1.5 rounded-inner text-xs font-medium transition-all
                              ${isActive
                                ? 'bg-civic-blue text-white shadow-md shadow-civic-blue/20 font-semibold'
                                : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </div>

                            {item.badge && (
                              <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold shrink-0 ${item.badgeColor || 'bg-surface-2 text-text-muted'}`}>
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Footer Actions */}
        <div className="flex flex-col gap-2 pt-3 border-t border-white/5 shrink-0">
          {token && user ? (
            <div className="p-2 rounded-inner bg-surface-2/80 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <UserCheck className="w-4 h-4 text-verified-teal shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="text-[11px] font-semibold text-white truncate">{user.full_name}</span>
                  <span className="text-[9px] font-mono text-verified-teal">{user.role}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout from government session"
                className="p-1 rounded text-text-muted hover:text-alert-red hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/government/login"
              className="flex items-center justify-between px-3 py-1.5 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs text-text-muted hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-civic-blue" />
                <span>Government Login</span>
              </div>
              <span className="text-[9px] font-mono text-civic-blue font-bold">AUTH</span>
            </Link>
          )}

          {/* Switch to Citizen Hub */}
          <Link
            to="/public"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-inner bg-verified-teal/10 hover:bg-verified-teal/20 border border-verified-teal/20 text-xs text-verified-teal transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="font-semibold">Public Citizen Hub</span>
            </div>
            <span className="text-[9px] font-mono">PORTAL</span>
          </Link>
          <div className="text-[8px] font-mono text-text-muted/50 text-center uppercase">
            Municipal Autonomous Mesh // 2026
          </div>
        </div>
      </aside>
    </>
  );
};
