import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Plus, Globe, Key, Copy, Check, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrigins, useCreateOrigin, useDeleteOrigin } from "@/hooks/useOrigins";
import { useToast } from "@/hooks/use-toast";

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
      className="h-8 w-8 hover-elevate active-elevate-2"
      data-testid="button-copy"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function Origins() {
  const { address, isConnected } = useAccount();
  const { data: origins, isLoading } = useOrigins();
  const createOrigin = useCreateOrigin();
  const deleteOrigin = useDeleteOrigin();
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [originToDelete, setOriginToDelete] = useState<{ id: string; domain: string } | null>(null);

  const handleCreateOrigin = async () => {
    try {
      await createOrigin.mutateAsync(newDomain);
      toast({
        title: "Origin created",
        description: `Successfully registered ${newDomain}`,
      });
      setNewDomain("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create origin. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrigin = async () => {
    if (!originToDelete) return;
    
    try {
      await deleteOrigin.mutateAsync(originToDelete.id);
      toast({
        title: "Origin deleted",
        description: `Successfully deleted ${originToDelete.domain}`,
      });
      setDeleteDialogOpen(false);
      setOriginToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete origin. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to manage origins and view analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Origins</h1>
            <p className="text-muted-foreground mt-2">
              Manage domains authorized to collect encrypted analytics
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-origin">
                <Plus className="h-4 w-4" />
                Add Origin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Origin</DialogTitle>
                <DialogDescription>
                  Add a new domain to start collecting encrypted analytics
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    data-testid="input-domain"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your domain without protocol (http/https)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateOrigin} 
                  disabled={!newDomain || createOrigin.isPending} 
                  data-testid="button-confirm-create"
                >
                  {createOrigin.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Origin'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Origins List */}
        <div className="grid gap-6">
          {origins && origins.length > 0 && origins.map((origin) => (
            <Card key={origin.id} className="hover-elevate" data-testid={`card-origin-${origin.domain}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{origin.domain}</CardTitle>
                      <CardDescription className="mt-1">
                        Created on {new Date(origin.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      Active
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover-elevate" data-testid="button-origin-menu">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive" 
                          data-testid="button-delete-origin"
                          onClick={() => {
                            setOriginToDelete({ id: origin.id, domain: origin.domain });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Origin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Token */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <Key className="h-3.5 w-3.5" />
                    API Token (keep secret)
                  </Label>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
                    <code className="flex-1 text-sm font-mono" data-testid="text-api-token">
                      {origin.token}
                    </code>
                    <CopyButton text={origin.token} />
                  </div>
                </div>

                {/* Integration Code */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Collector Script
                  </Label>
                  <div className="relative">
                    <pre className="p-3 rounded-md bg-muted/50 border overflow-x-auto text-xs">
                      <code className="font-mono">{`<script src="https://zama-fhevm-na1g.vercel.app/fhe-analytics.js"
        data-origin-token="${origin.token}"
        async></script>`}</code>
                    </pre>
                    <div className="absolute top-2 right-2">
                      <CopyButton text={`<script src="https://zama-fhevm-na1g.vercel.app/fhe-analytics.js" data-origin-token="${origin.token}" async></script>`} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!origins || origins.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No origins yet</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Create your first origin to start collecting privacy-preserving analytics
              </p>
              <Button onClick={() => setOpen(true)} data-testid="button-create-first-origin">
                <Plus className="h-4 w-4 mr-2" />
                Add Origin
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Origin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{originToDelete?.domain}</strong>?
              This will permanently delete all associated analytics data, encrypted events, and API tokens.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrigin}
              disabled={deleteOrigin.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteOrigin.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
