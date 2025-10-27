import { Users, Eye, Clock, MousePointerClick, TrendingUp, Activity, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MetricCard } from "@/components/MetricCard";
import { EncryptionBadge } from "@/components/EncryptionBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useOrigins } from "@/hooks/useOrigins";
import { useMetrics } from "@/hooks/useMetrics";
import HeroSection from "@/components/HeroSection";

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { data: origins, isLoading: originsLoading } = useOrigins();
  const firstOrigin = origins?.[0];
  
  // Always call hooks in the same order
  const { data: metricsData, isLoading: metricsLoading } = useMetrics(firstOrigin?.id);

  // Show hero section when not connected
  if (!isConnected) {
    return <HeroSection />;
  }

  if (originsLoading || metricsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading encrypted analytics...</p>
        </div>
      </div>
    );
  }

  if (!firstOrigin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle>No Origins Yet</CardTitle>
            <CardDescription>
              Create your first origin to start collecting privacy-preserving analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/origins" className="text-primary underline">
              Create Origin
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = metricsData?.metrics || {
    visitors: 0,
    pageviews: 0,
    sessions: 0,
    avgSession: 0,
    bounceRate: 0,
    conversions: 0,
    encrypted: true,
  };

  const timeSeries = metricsData?.timeSeries || [];
  const topPages = metricsData?.topPages || [];
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Privacy-preserving analytics powered by Fully Homomorphic Encryption
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Visitors"
            value={metrics.visitors}
            icon={Users}
            encrypted={metrics.encrypted}
          />
          <MetricCard
            title="Page Views"
            value={metrics.pageviews}
            icon={Eye}
            encrypted={metrics.encrypted}
          />
          <MetricCard
            title="Avg. Session"
            value={metrics.avgSession ? `${metrics.avgSession} pages` : '0 pages'}
            icon={Clock}
            encrypted={metrics.encrypted}
          />
          <MetricCard
            title="Conversions"
            value={metrics.conversions}
            icon={MousePointerClick}
            encrypted={metrics.encrypted}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Time Series Chart */}
          <Card className="hover-elevate" data-testid="card-time-series">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Visitor Trends</CardTitle>
                  <CardDescription>Last 7 days of encrypted traffic</CardDescription>
                </div>
                <EncryptionBadge status="encrypted" />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs" 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pageviews" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card className="hover-elevate" data-testid="card-top-pages">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Pages</CardTitle>
                  <CardDescription>Most visited pages (encrypted counts)</CardDescription>
                </div>
                <EncryptionBadge status="never-decrypted" />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topPages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                  <XAxis 
                    type="number" 
                    className="text-xs" 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="page" 
                    className="text-xs" 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Bar 
                    dataKey="views" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Panel */}
        <Card className="border-primary/20 bg-primary/5" data-testid="card-privacy-panel">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Privacy-First Analytics</CardTitle>
                <CardDescription>
                  All metrics are encrypted client-side using Zama's FHE SDK
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-emerald-500/10 mt-0.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">End-to-End Encrypted</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Data encrypted in browser before transmission
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10 mt-0.5">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Homomorphic Aggregation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Compute on encrypted data without decryption
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-violet-500/10 mt-0.5">
                  <MousePointerClick className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">On-Chain Anchored</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aggregate digests verified on Sepolia testnet
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
