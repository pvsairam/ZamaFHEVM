import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Copy, Check, Code, Shield, Zap, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useOrigins } from "@/hooks/useOrigins";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8"
      data-testid="button-copy"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function CodeBlock({ code, language = "html" }: { code: string; language?: string }) {
  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <CopyButton text={code} />
      </div>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code className="text-foreground">{code}</code>
      </pre>
    </div>
  );
}

export default function Integration() {
  const { isConnected } = useAccount();
  const { data: origins } = useOrigins();
  const firstOrigin = origins?.[0];

  // Generate installation script (generic or personalized)
  const installScript = firstOrigin
    ? `<!-- FHE Analytics - Privacy-Preserving Analytics -->
<script 
  src="${window.location.origin}/fhe-analytics.js" 
  data-origin-token="${firstOrigin.token}"
  async
></script>`
    : `<!-- FHE Analytics - Privacy-Preserving Analytics -->
<script 
  src="${window.location.origin}/fhe-analytics.js" 
  data-origin-token="YOUR_ORIGIN_TOKEN"
  async
></script>`;

  const manualTracking = `// Track custom events
window.fheAnalytics.track('button_click', { 
  button: 'signup' 
});

// Track conversions
window.fheAnalytics.conversion(99.99, { 
  product: 'Premium Plan' 
});`;

  const elementTracking = `<!-- Automatic tracking with data attribute -->
<button data-fhe-track="cta_click">
  Get Started
</button>

<a href="/pricing" data-fhe-track="pricing_view">
  View Pricing
</a>`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-integration">Integration Guide</h1>
          <p className="text-muted-foreground mt-2">
            Add privacy-preserving analytics to your website in under 2 minutes
          </p>
          {!isConnected && (
            <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Want personalized integration instructions?</p>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to see code examples with your actual origin tokens.
                </p>
              </div>
              <ConnectButton />
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">End-to-End Encrypted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All metrics encrypted with FHE before leaving the browser. Zero plaintext data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Real-Time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Live dashboard updates via Server-Sent Events. See metrics as they happen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">One-Line Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Single script tag. No configuration. Works with any website or framework.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Installation */}
        <Card>
          <CardHeader>
            <CardTitle>1. Install Tracking Script</CardTitle>
            <CardDescription>
              Add this script tag to your website's <code>&lt;head&gt;</code> or before <code>&lt;/body&gt;</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!firstOrigin && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>No origin found.</strong> Create an origin first in the{" "}
                  <a href="/origins" className="underline">Origins page</a>.
                </p>
              </div>
            )}
            <CodeBlock code={installScript} language="html" />
            {firstOrigin && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>Automatic pageview and session tracking enabled</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>2. Track Custom Events (Optional)</CardTitle>
            <CardDescription>
              Use the JavaScript API to track events programmatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock code={manualTracking} language="javascript" />
          </CardContent>
        </Card>

        {/* Automatic Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>3. Automatic Element Tracking (Optional)</CardTitle>
            <CardDescription>
              Add <code>data-fhe-track</code> attribute to any element for automatic tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock code={elementTracking} language="html" />
          </CardContent>
        </Card>

        {/* Verification */}
        <Card>
          <CardHeader>
            <CardTitle>3. Verify Installation</CardTitle>
            <CardDescription>
              Check that events are being collected and encrypted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Open your website</p>
                  <p className="text-xs text-muted-foreground">Navigate to the page with the tracking script installed</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Check browser console</p>
                  <p className="text-xs text-muted-foreground">
                    Look for: <code className="text-xs bg-muted px-1 rounded">[FHE Analytics] Initialized</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">View dashboard</p>
                  <p className="text-xs text-muted-foreground">
                    Visit the <a href="/" className="text-primary underline">Dashboard</a> to see real-time encrypted metrics
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button asChild className="w-full">
                <a href="/" data-testid="link-dashboard">
                  <Zap className="h-4 w-4 mr-2" />
                  View Dashboard
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* On-Chain Verification */}
        {firstOrigin && (
          <Card>
            <CardHeader>
              <CardTitle>On-Chain Proof Verification</CardTitle>
              <CardDescription>
                Daily aggregate proofs are anchored on Sepolia testnet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Blockchain Anchoring</p>
                  <p className="text-xs text-muted-foreground">
                    Proof digests stored on Ethereum Sepolia for immutable verification
                  </p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>

              <Button variant="outline" className="w-full" disabled>
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Etherscan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Having trouble with integration? Check common issues:
            </p>
            <div className="space-y-2 text-sm">
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">
                  Script not loading?
                </summary>
                <p className="text-muted-foreground mt-2 ml-4">
                  Ensure the script URL is correct and your origin is properly configured. Check browser console for errors.
                </p>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">
                  Events not appearing in dashboard?
                </summary>
                <p className="text-muted-foreground mt-2 ml-4">
                  Events are batched and sent every 3 seconds or when 5 events accumulate. Refresh the dashboard after sending events.
                </p>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">
                  CORS errors?
                </summary>
                <p className="text-muted-foreground mt-2 ml-4">
                  The collection endpoint supports CORS. Ensure your origin domain matches the one registered in Origins page.
                </p>
              </details>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
