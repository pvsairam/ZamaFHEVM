import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, Users, MousePointerClick, ExternalLink, Zap, Activity, TrendingUp, Loader2, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import deployedContract from "../../../contracts/deployed.json";

interface Metrics {
  visitors: number;
  pageviews: number;
  sessions: number;
  conversions: number;
  avgSession: number;
  encrypted: boolean;
}

interface DemoOrigin {
  id: string;
  domain: string;
  token: string;
}

export default function LiveDemo() {
  const [metrics, setMetrics] = useState<Metrics>({
    visitors: 0,
    pageviews: 0,
    sessions: 0,
    conversions: 0,
    avgSession: 0,
    encrypted: true,
  });
  const [demoOrigin, setDemoOrigin] = useState<DemoOrigin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [proofData, setProofData] = useState<{ digest: string; cid: string; day: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { data: hash, isPending: isWritePending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  
  // Check if origin is registered on-chain
  const { data: originOwner, refetch: refetchOwner } = useReadContract({
    address: deployedContract.address as `0x${string}`,
    abi: deployedContract.abi,
    functionName: 'getOriginOwner',
    args: demoOrigin ? [demoOrigin.id] : undefined,
    chainId: sepolia.id,
  });
  
  const isOriginRegistered = originOwner && originOwner !== '0x0000000000000000000000000000000000000000';

  // Fetch demo origin on mount
  useEffect(() => {
    async function fetchDemoOrigin() {
      try {
        const res = await fetch('/api/demo/origin');
        if (!res.ok) throw new Error('Failed to fetch demo origin');
        const data = await res.json();
        setDemoOrigin(data.origin);
      } catch (error) {
        console.error('[LiveDemo] Failed to fetch origin:', error);
        toast({
          title: "Error",
          description: "Failed to load demo origin",
          variant: "destructive",
        });
      }
    }
    fetchDemoOrigin();
  }, [toast]);

  // Polling for real-time updates (Vercel-compatible replacement for SSE)
  useEffect(() => {
    if (!demoOrigin) return;

    async function fetchMetrics() {
      try {
        const res = await fetch(`/api/metrics/${demoOrigin!.id}`);
        if (!res.ok) throw new Error('Failed to fetch metrics');
        const data = await res.json();
        setMetrics(data.metrics);
        setLastUpdate(new Date());
        setIsLoading(false);
      } catch (error) {
        console.error('[LiveDemo] Failed to fetch metrics:', error);
        setIsLoading(false);
      }
    }

    // Initial fetch
    fetchMetrics();

    // Poll every 5 seconds for updates
    const pollInterval = setInterval(fetchMetrics, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [demoOrigin]);

  // Register origin on-chain
  function registerOriginOnChain() {
    if (!demoOrigin || !isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    writeContract({
      address: deployedContract.address as `0x${string}`,
      abi: deployedContract.abi,
      functionName: 'registerOrigin',
      args: [demoOrigin.id, address],
      chainId: sepolia.id,
    });

    toast({
      title: "Registration Submitted",
      description: "Please approve the transaction in your wallet...",
    });
  }

  // Generate proof and submit to blockchain
  async function anchorProofToBlockchain() {
    if (!demoOrigin || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to anchor proofs on-chain",
        variant: "destructive",
      });
      return;
    }

    if (!isOriginRegistered) {
      toast({
        title: "Origin Not Registered",
        description: "Please register your origin on-chain first using the button above",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate proof digest
      const today = new Date().toISOString().split('T')[0];
      const proofRes = await fetch(`/api/proofs/${demoOrigin.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: today }),
      });

      if (!proofRes.ok) throw new Error('Failed to generate proof');
      const proof = await proofRes.json();
      
      const dayTimestamp = Math.floor(new Date(today).getTime() / 1000);
      setProofData({ digest: proof.digest, cid: proof.cid, day: dayTimestamp });

      // Submit to blockchain using connected wallet
      writeContract({
        address: deployedContract.address as `0x${string}`,
        abi: deployedContract.abi,
        functionName: 'anchorProof',
        args: [demoOrigin.id, BigInt(dayTimestamp), proof.digest as `0x${string}`, proof.cid],
        chainId: sepolia.id,
      });

      toast({
        title: "Transaction Submitted",
        description: "Please approve the transaction in your wallet...",
      });
    } catch (error: any) {
      console.error('[LiveDemo] Failed to anchor proof:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit transaction",
        variant: "destructive",
      });
    }
  }

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      // Refetch origin owner status after transaction
      refetchOwner();
      
      if (proofData) {
        toast({
          title: "✅ Proof Anchored on Sepolia!",
          description: (
            <div className="space-y-2 mt-2">
              <p className="text-sm font-mono">Digest: {proofData.digest.substring(0, 20)}...</p>
              <p className="text-sm font-mono">CID: {proofData.cid}</p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
              >
                View on Etherscan <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ),
          duration: 10000,
        });
        setProofData(null);
      } else {
        // Registration transaction
        toast({
          title: "✅ Origin Registered!",
          description: (
            <div className="space-y-2 mt-2">
              <p className="text-sm">Your origin is now registered on Sepolia. You can now anchor proofs!</p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
              >
                View on Etherscan <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ),
          duration: 10000,
        });
      }
    }
  }, [isConfirmed, hash, proofData, toast, refetchOwner]);

  // Handle transaction error
  useEffect(() => {
    if (writeError) {
      toast({
        title: "Transaction Failed",
        description: writeError.message,
        variant: "destructive",
      });
    }
  }, [writeError, toast]);

  const totalEvents = metrics.visitors + metrics.pageviews + metrics.sessions + metrics.conversions;
  const isLive = !!demoOrigin;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                Live Demo Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Real-time encrypted analytics (polling every 5s)
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLive && (
                <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10" data-testid="badge-live-status">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-emerald-500 mr-2"
                  ></motion.div>
                  Live
                </Badge>
              )}
              <Button onClick={() => window.open('/demo', '_blank')} data-testid="button-visit-demo">
                Visit Demo Page
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">How to Test</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click <strong>"Visit Demo Page"</strong> → Interact with buttons, forms, and links → Watch metrics update here in real-time.
                    All data is <strong>encrypted with FHE</strong> before transmission. Updates refresh every 5 seconds.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      5s Polling
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      FHE Encrypted
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Vercel Compatible
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Metrics Display */}
        {!isLoading && isLive && (
          <>
            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="metric-visitors">{metrics.visitors}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3 text-emerald-600" />
                      Encrypted count
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="metric-pageviews">{metrics.pageviews}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3 text-emerald-600" />
                      Encrypted count
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="metric-sessions">{metrics.sessions}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3 text-emerald-600" />
                      Encrypted count
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="metric-conversions">{metrics.conversions.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3 text-emerald-600" />
                      Encrypted value
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Blockchain Proof Anchoring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    Blockchain Proof Anchoring
                  </CardTitle>
                  <CardDescription>
                    Anchor aggregated metrics proof on Sepolia testnet for immutable verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg flex-wrap gap-4">
                    <div>
                      <p className="font-medium">Contract Deployed on Sepolia</p>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        0x399019006bd73dd05bc4b591a16090dd889773c3
                      </p>
                    </div>
                    <Button
                      onClick={() => window.open('https://sepolia.etherscan.io/address/0x399019006bd73dd05bc4b591a16090dd889773c3', '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      View on Etherscan
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </div>

                  {/* Registration Status */}
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Step 1: Register Origin</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isOriginRegistered 
                            ? "✅ Your origin is registered on-chain"
                            : "Register your origin before anchoring proofs"
                          }
                        </p>
                      </div>
                      {isOriginRegistered ? (
                        <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10">
                          Registered
                        </Badge>
                      ) : (
                        <Button
                          onClick={registerOriginOnChain}
                          disabled={!isConnected || isWritePending || isConfirming}
                          size="sm"
                          variant="default"
                          data-testid="button-register-origin"
                        >
                          {(isWritePending || isConfirming) && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Register
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Anchor Proof Button */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Step 2: Anchor Daily Proof</p>
                    <Button
                      onClick={anchorProofToBlockchain}
                      disabled={!isConnected || !isOriginRegistered || isWritePending || isConfirming}
                      className="w-full"
                      size="lg"
                      data-testid="button-anchor-proof"
                    >
                      {(isWritePending || isConfirming) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isConfirming ? "Confirming..." : isWritePending ? "Submitting..." : !isConnected ? "Connect Wallet First" : !isOriginRegistered ? "Register Origin First" : "Anchor Proof on Sepolia"}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    {!isConnected 
                      ? "Connect your wallet to register and anchor proofs on Sepolia testnet."
                      : !isOriginRegistered
                      ? "Register your origin first (one-time setup), then you can anchor daily proofs."
                      : "Generate and anchor today's proof digest on Sepolia with one click."
                    }
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Real-Time Polling Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Real-Time Updates
                  </CardTitle>
                  <CardDescription>
                    Metrics refresh automatically every 5 seconds (Vercel serverless-compatible)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="h-3 w-3 rounded-full bg-emerald-500"
                      ></motion.div>
                      <div>
                        <p className="font-medium">Polling Active</p>
                        <p className="text-sm text-muted-foreground">
                          Last update: {lastUpdate.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" data-testid="stat-events-processed">{totalEvents.toFixed(0)}</p>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Privacy Guarantee */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Shield className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-bold">Privacy Guarantee</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        <p className="text-3xl font-bold text-emerald-600 mb-1">100%</p>
                        <p className="text-sm text-muted-foreground">Encrypted</p>
                      </div>
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-3xl font-bold text-primary mb-1">0</p>
                        <p className="text-sm text-muted-foreground">Plaintext Stored</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                      All individual events are encrypted with Fully Homomorphic Encryption. 
                      Only aggregated statistics are decrypted for display.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
