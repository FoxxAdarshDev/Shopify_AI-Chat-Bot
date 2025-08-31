import { DashboardAnalytics } from "@/types";

interface StatsCardsProps {
  analytics?: DashboardAnalytics;
}

export default function StatsCards({ analytics }: StatsCardsProps) {
  const stats = [
    {
      label: "Total Conversations",
      value: analytics?.totalConversations || 0,
      icon: (
        <svg className="w-6 h-6 text-chart-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
        </svg>
      ),
      trend: "+12.5%",
      trendLabel: "from last month",
      bgColor: "bg-chart-1/10"
    },
    {
      label: "Active Chats",
      value: analytics?.activeChats || 0,
      icon: (
        <svg className="w-6 h-6 text-chart-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      trend: "Live",
      trendLabel: "real-time updates",
      bgColor: "bg-chart-2/10"
    },
    {
      label: "AI Response Rate",
      value: `${analytics?.responseRate || 0}%`,
      icon: (
        <svg className="w-6 h-6 text-chart-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      trend: "+2.1%",
      trendLabel: "improvement",
      bgColor: "bg-chart-3/10"
    },
    {
      label: "Store Products",
      value: analytics?.productsCount || 0,
      icon: (
        <svg className="w-6 h-6 text-chart-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      ),
      trend: "Synced",
      trendLabel: "2 hours ago",
      bgColor: "bg-chart-4/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-card rounded-lg border border-border p-6" data-testid={`stat-card-${index}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold" data-testid={`stat-value-${index}`}>{stat.value}</p>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
              {stat.icon}
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">{stat.trend}</span>
            <span className="text-muted-foreground text-sm ml-2">{stat.trendLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
