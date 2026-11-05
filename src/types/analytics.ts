export type AdminAnalyticsDashboard =
  | {
      status: "setup_required";
      propertyId: string | null;
      missing: string[];
      rangeDays: number;
    }
  | {
      status: "connection_error";
      propertyId: string;
      rangeDays: number;
      message: string;
    }
  | {
      status: "ready";
      propertyId: string;
      rangeDays: number;
      generatedAt: string;
      current: {
        activeUsers: number;
        newUsers: number;
        sessions: number;
        pageViews: number;
        engagedSessions: number;
        engagementRate: number;
        averageSessionDuration: number;
        eventCount: number;
        purchases: number;
        revenue: number;
      };
      previous: {
        activeUsers: number;
        newUsers: number;
        sessions: number;
        pageViews: number;
        engagedSessions: number;
        engagementRate: number;
        averageSessionDuration: number;
        eventCount: number;
        purchases: number;
        revenue: number;
      };
      trend: Array<{ date: string; activeUsers: number; sessions: number }>;
      topPages: Array<{ path: string; title: string; views: number; users: number }>;
      channels: Array<{ name: string; sessions: number; users: number }>;
      countries: Array<{ name: string; users: number; sessions: number }>;
      devices: Array<{ name: string; users: number; sessions: number }>;
      events: Array<{ name: string; count: number; users: number }>;
      landingPages: Array<{ path: string; sessions: number; users: number }>;
      products: Array<{ name: string; views: number; addedToCart: number; purchases: number; revenue: number }>;
    };

export type AdminAnalyticsRealtime =
  | {
      status: "ready";
      generatedAt: string;
      activeUsers: number;
      views: number;
      pages: Array<{ title: string; views: number; users: number }>;
    }
  | {
      status: "connection_error";
      message: string;
    };

