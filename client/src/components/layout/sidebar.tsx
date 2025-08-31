import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  store?: {
    name: string;
    domain: string;
    status: 'active' | 'inactive';
  };
}

export default function Sidebar({ store }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 7l5 5l5-5"/>
        </svg>
      ),
      badge: null
    },
    {
      href: "/chat-management",
      label: "Chat Management",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
        </svg>
      ),
      badge: "24"
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      ),
      badge: null
    },
    {
      href: "/store-sync",
      label: "Store Data Sync",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
        </svg>
      ),
      badge: null,
      indicator: true
    },
    {
      href: "/settings",
      label: "Settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* App Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg" data-testid="app-title">AI Chat Support</h1>
            <p className="text-xs text-muted-foreground">Shopify Partner App</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2" data-testid="navigation">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer",
                location === item.href
                  ? "sidebar-active text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
            >
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.indicator && (
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full pulse-animation"></span>
              )}
            </span>
          </Link>
        ))}
      </nav>

      {/* Store Info */}
      <div className="p-4 border-t border-border">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {store?.name?.charAt(0) || 'S'}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm" data-testid="store-name">
                {store?.name || 'Store Name'}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="store-domain">
                {store?.domain || 'store.myshopify.com'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status:</span>
            <span 
              className={cn(
                "px-2 py-1 rounded-full",
                store?.status === 'active' 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              )}
              data-testid="store-status"
            >
              {store?.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
