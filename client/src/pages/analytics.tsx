import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";

export default function Analytics() {
  const { data: store } = useQuery({
    queryKey: ['/api/stores/current']
  });

  const { data: chatPerformance } = useQuery({
    queryKey: ['/api/analytics/chat-performance'],
    refetchInterval: 60000
  });

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar store={store} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="page-title">Analytics</h2>
              <p className="text-muted-foreground">Analyze chat performance and customer interactions</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground">
              Detailed analytics and performance metrics will be available here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
