import { Lock, Shield, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EncryptionStatus = "encrypted" | "fhe-aggregated" | "pending" | "never-decrypted";

interface EncryptionBadgeProps {
  status: EncryptionStatus;
  className?: string;
}

export function EncryptionBadge({ status, className }: EncryptionBadgeProps) {
  const variants = {
    encrypted: {
      icon: Lock,
      label: "End-to-End Encrypted",
      className: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20",
    },
    "fhe-aggregated": {
      icon: Shield,
      label: "FHE Aggregated",
      className: "bg-primary/10 text-primary dark:bg-primary/20 border-primary/20",
    },
    pending: {
      icon: Eye,
      label: "Pending Encryption",
      className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20",
    },
    "never-decrypted": {
      icon: EyeOff,
      label: "Never Decrypted",
      className: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 border-violet-500/20",
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2 py-0.5 text-xs font-medium border",
        variant.className,
        className
      )}
      data-testid={`badge-encryption-${status}`}
    >
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
}
