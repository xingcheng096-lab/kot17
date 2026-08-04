import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  LogOut,
  ChevronDown,
  Search,
  Globe,
  CircleUserRound,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getNavForRole, getDefaultPath } from '@/lib/navigation';
import { ROLE_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!profile) return null;

  const navItems = getNavForRole(profile.role);
  const groups = Array.from(new Set(navItems.map((i) => i.group)));
  const initials = profile.full_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-primary-foreground/15 px-5 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-md">
          <span className="font-khmer text-lg font-bold">១៧</span>
        </div>
        <div className="min-w-0">
          <p className="font-khmer truncate text-sm font-bold leading-tight">
            កុដិលេខ ១៧
          </p>
          <p className="truncate text-[11px] text-primary-foreground/70">
            KOT 17 Management
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group} className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/50">
              {group}
            </p>
            <div className="space-y-1">
              {navItems
                .filter((i) => i.group === group)
                .map((item) => {
                  const active =
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-primary-foreground text-primary shadow-sm'
                          : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <span className="block truncate font-medium">{item.label}</span>
                        <span className="font-khmer block truncate text-[11px] opacity-70">
                          {item.labelKh}
                        </span>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-primary-foreground/15 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-primary-foreground/10 px-3 py-2.5">
          <Avatar className="h-9 w-9 border border-primary-foreground/20">
            <AvatarFallback className="bg-primary-foreground/10 text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-primary-foreground">
              {profile.full_name}
            </p>
            <p className="truncate text-[11px] text-primary-foreground/70">
              {ROLE_LABELS[profile.role].en}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{SidebarContent}</aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 animate-slide-in">
            {SidebarContent}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md bg-primary-foreground/10 p-1.5 text-primary-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topnav */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <span className="font-khmer text-sm font-semibold text-foreground">
              វត្តបុទុមវតីរាជវរា
            </span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Wat Botumvatey Rajavararam</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="ស្វែងរក... / Search..."
                className="h-9 w-56 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button variant="ghost" size="icon" className="relative" title="Language">
              <Globe className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="relative" title="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-secondary" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="max-w-[120px] truncate text-sm font-medium leading-tight">
                      {profile.full_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {ROLE_LABELS[profile.role].en}
                    </p>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="truncate">{profile.full_name}</span>
                    <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                      {ROLE_LABELS[profile.role].kh}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(getDefaultPath(profile.role))}>
                  <CircleUserRound className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out / ចាកចេញ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
