import { Heart } from "lucide-react";
import { SiX } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm py-8">
      <div className="mx-auto max-w-7xl px-6">
        {/* Built by xtestnet - centered */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Built with</span>
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          <span>by</span>
          <a 
            href="https://x.com/xtestnet" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
            data-testid="link-xtestnet"
          >
            <SiX className="h-3.5 w-3.5" />
            xtestnet
          </a>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FHE-Analytics. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
