import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Lock, Send, CheckCircle2 } from "lucide-react";
import { EncryptionBadge } from "@/components/EncryptionBadge";
import { useCollectEvent } from "@/hooks/useMetrics";
import { useOrigins } from "@/hooks/useOrigins";
import { useToast } from "@/hooks/use-toast";

export default function Demo() {
  const [events, setEvents] = useState<Array<{ id: number; type: string; encrypted: boolean; timestamp: string }>>([]);
  const { data: origins } = useOrigins();
  const collectEvent = useCollectEvent();
  const { toast } = useToast();
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Use first origin as demo origin
  const demoOrigin = origins?.[0];

  const sendEncryptedEvent = async (eventType: 'pageview' | 'session' | 'conversion' | 'event') => {
    if (!demoOrigin) {
      toast({
        title: "No Origin",
        description: "Create an origin first to send encrypted events",
        variant: "destructive",
      });
      return;
    }

    setIsEncrypting(true);
    
    try {
      // Simulate FHE encryption delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Send to backend
      await collectEvent.mutateAsync({
        originToken: demoOrigin.token,
        eventType,
        page: '/demo',
        value: 1,
      });

      const newEvent = {
        id: Date.now(),
        type: eventType,
        encrypted: true,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setEvents(prev => [newEvent, ...prev].slice(0, 10));
      
      toast({
        title: "Event Encrypted",
        description: `${eventType} encrypted and sent successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send encrypted event",
        variant: "destructive",
      });
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Live FHE Demo</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience privacy-preserving analytics in action. Click buttons below to send encrypted events using Zama's Fully Homomorphic Encryption.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Event Triggers */}
          <Card data-testid="card-event-triggers">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Send Encrypted Events</CardTitle>
                  <CardDescription>
                    Simulate real analytics events with FHE encryption
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => sendEncryptedEvent("pageview")}
                  disabled={isEncrypting}
                  className="w-full"
                  data-testid="button-send-pageview"
                >
                  {isEncrypting ? "Encrypting..." : "Track Pageview"}
                </Button>
                <Button
                  onClick={() => sendEncryptedEvent("session")}
                  disabled={isEncrypting}
                  variant="secondary"
                  className="w-full"
                  data-testid="button-send-session"
                >
                  {isEncrypting ? "Encrypting..." : "Track Session"}
                </Button>
                <Button
                  onClick={() => sendEncryptedEvent("conversion")}
                  disabled={isEncrypting}
                  variant="outline"
                  className="w-full"
                  data-testid="button-send-conversion"
                >
                  {isEncrypting ? "Encrypting..." : "Track Conversion"}
                </Button>
                <Button
                  onClick={() => sendEncryptedEvent("event")}
                  disabled={isEncrypting}
                  variant="outline"
                  className="w-full"
                  data-testid="button-send-event"
                >
                  {isEncrypting ? "Encrypting..." : "Custom Event"}
                </Button>
              </div>
              
              {isEncrypting && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="animate-spin">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Encrypting with FHE...</p>
                    <p className="text-xs text-muted-foreground">
                      Using euint32 encryption for metric values
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Log */}
          <Card data-testid="card-event-log">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle>Encrypted Event Log</CardTitle>
                    <CardDescription>
                      Recent events sent to analytics backend
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No events yet</p>
                    <p className="text-xs mt-1">Send an encrypted event to get started</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate transition-all"
                      data-testid={`event-log-${event.type}`}
                    >
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate capitalize">
                            {event.type}
                          </p>
                          <EncryptionBadge status="encrypted" className="scale-90" />
                        </div>
                        <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="border-primary/20 bg-primary/5" data-testid="card-how-it-works">
          <CardHeader>
            <CardTitle>How FHE Analytics Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    1
                  </span>
                  Client Encryption
                </div>
                <p className="text-sm text-muted-foreground">
                  Browser encrypts metric values using Zama's FHE public key before transmission. Individual data never leaves plaintext form.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    2
                  </span>
                  Homomorphic Aggregation
                </div>
                <p className="text-sm text-muted-foreground">
                  Server computes sums, averages, and counts on encrypted ciphertexts without ever decrypting individual events.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    3
                  </span>
                  Aggregate Display
                </div>
                <p className="text-sm text-muted-foreground">
                  Only aggregated statistics are decrypted for display. Digest is anchored on Sepolia testnet for verification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
