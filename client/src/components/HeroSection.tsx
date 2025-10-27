import { motion } from "framer-motion";
import { Shield, Lock, ArrowRight, Globe, Server, BarChart3, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

// Network Node Component with absolute positioning
const NetworkNode = ({ 
  icon: Icon, 
  label, 
  x, 
  y, 
  delay
}: { 
  icon: any; 
  label: string; 
  x: string; 
  y: string; 
  delay: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
      }}
      className="flex flex-col items-center gap-3 w-32"
    >
      <motion.div
        animate={{
          boxShadow: [
            '0 0 20px rgba(139, 92, 246, 0.3)',
            '0 0 40px rgba(139, 92, 246, 0.6)',
            '0 0 20px rgba(139, 92, 246, 0.3)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative bg-card border-2 border-primary/40 rounded-xl p-4 backdrop-blur-sm mx-auto"
      >
        <Icon className="h-8 w-8 text-primary" />
      </motion.div>
      <p className="text-sm font-medium text-center text-foreground/90 whitespace-nowrap">{label}</p>
    </motion.div>
  );
};

// Animated Data Packet - FIXED to stay on connection lines
const DataPacket = ({ 
  path, 
  delay,
  duration = 3 
}: { 
  path: { x: string[]; y: string[] };
  delay: number;
  duration?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        left: path.x,
        top: path.y,
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
        repeatDelay: 1,
      }}
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)', // CENTER the dot on the path
      }}
      className="w-2 h-2 bg-primary rounded-full"
    />
  );
};

// Connection Line Component using pixel coordinates
const ConnectionLine = ({ 
  x1, 
  y1, 
  x2, 
  y2, 
  delay 
}: { 
  x1: string; 
  y1: string; 
  x2: string; 
  y2: string; 
  delay: number;
}) => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      transition={{ duration: 0.6, delay }}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeDasharray="8 8"
        animate={{
          strokeDashoffset: [0, -16],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </motion.svg>
  );
};

export default function HeroSection() {
  // Define node positions using calc for centered alignment
  const nodePositions = {
    browser: { x: 'calc(5% - 64px)', y: 'calc(50% - 24px)' },
    encryption: { x: 'calc(25% - 64px)', y: 'calc(50% - 24px)' },
    compute: { x: 'calc(50% - 64px)', y: 'calc(20% - 24px)' },
    storage: { x: 'calc(50% - 64px)', y: 'calc(80% - 24px)' },
    gateway: { x: 'calc(75% - 64px)', y: 'calc(50% - 24px)' },
    dashboard: { x: 'calc(95% - 64px)', y: 'calc(50% - 24px)' },
  };

  // Connection line coordinates (icon centers)
  const lineCoords = {
    browser: { x: '5%', y: '50%' },
    encryption: { x: '25%', y: '50%' },
    compute: { x: '50%', y: '20%' },
    storage: { x: '50%', y: '80%' },
    gateway: { x: '75%', y: '50%' },
    dashboard: { x: '95%', y: '50%' },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Gradient orb - subtle */}
      <motion.div
        animate={{
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Privacy-First Analytics
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Track user behavior without compromising privacy using Fully Homomorphic Encryption.
          </p>
          
          {/* Powered by Zama FHE Badge */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-primary">
              Powered by Zama FHE
            </span>
          </div>

          {/* CTA Button */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/integration'}
              data-testid="button-integration"
              className="text-base"
            >
              View Integration Guide
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Network Topology Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative w-full max-w-6xl mx-auto mb-32"
          style={{ height: '400px' }}
        >
          {/* Connection Lines */}
          <ConnectionLine 
            x1={lineCoords.browser.x} 
            y1={lineCoords.browser.y} 
            x2={lineCoords.encryption.x} 
            y2={lineCoords.encryption.y} 
            delay={0.6} 
          />
          <ConnectionLine 
            x1={lineCoords.encryption.x} 
            y1={lineCoords.encryption.y} 
            x2={lineCoords.compute.x} 
            y2={lineCoords.compute.y} 
            delay={0.7} 
          />
          <ConnectionLine 
            x1={lineCoords.encryption.x} 
            y1={lineCoords.encryption.y} 
            x2={lineCoords.storage.x} 
            y2={lineCoords.storage.y} 
            delay={0.8} 
          />
          <ConnectionLine 
            x1={lineCoords.compute.x} 
            y1={lineCoords.compute.y} 
            x2={lineCoords.gateway.x} 
            y2={lineCoords.gateway.y} 
            delay={0.9} 
          />
          <ConnectionLine 
            x1={lineCoords.storage.x} 
            y1={lineCoords.storage.y} 
            x2={lineCoords.gateway.x} 
            y2={lineCoords.gateway.y} 
            delay={1.0} 
          />
          <ConnectionLine 
            x1={lineCoords.gateway.x} 
            y1={lineCoords.gateway.y} 
            x2={lineCoords.dashboard.x} 
            y2={lineCoords.dashboard.y} 
            delay={1.1} 
          />

          {/* Animated Data Packets - NOW CONSTRAINED to connection lines */}
          <DataPacket 
            path={{ 
              x: [lineCoords.browser.x, lineCoords.encryption.x], 
              y: [lineCoords.browser.y, lineCoords.encryption.y] 
            }} 
            delay={1.5} 
            duration={2} 
          />
          <DataPacket 
            path={{ 
              x: [lineCoords.encryption.x, lineCoords.compute.x], 
              y: [lineCoords.encryption.y, lineCoords.compute.y] 
            }} 
            delay={3.0} 
            duration={2} 
          />
          <DataPacket 
            path={{ 
              x: [lineCoords.encryption.x, lineCoords.storage.x], 
              y: [lineCoords.encryption.y, lineCoords.storage.y] 
            }} 
            delay={3.5} 
            duration={2} 
          />
          <DataPacket 
            path={{ 
              x: [lineCoords.compute.x, lineCoords.gateway.x], 
              y: [lineCoords.compute.y, lineCoords.gateway.y] 
            }} 
            delay={5.0} 
            duration={2} 
          />
          <DataPacket 
            path={{ 
              x: [lineCoords.storage.x, lineCoords.gateway.x], 
              y: [lineCoords.storage.y, lineCoords.gateway.y] 
            }} 
            delay={5.5} 
            duration={2} 
          />
          <DataPacket 
            path={{ 
              x: [lineCoords.gateway.x, lineCoords.dashboard.x], 
              y: [lineCoords.gateway.y, lineCoords.dashboard.y] 
            }} 
            delay={7.0} 
            duration={2} 
          />

          {/* Network Nodes */}
          <NetworkNode
            icon={Globe}
            label="User Browser"
            x={nodePositions.browser.x}
            y={nodePositions.browser.y}
            delay={0.6}
          />
          <NetworkNode
            icon={Lock}
            label="FHE Encryption"
            x={nodePositions.encryption.x}
            y={nodePositions.encryption.y}
            delay={0.8}
          />
          <NetworkNode
            icon={Server}
            label="Compute Layer"
            x={nodePositions.compute.x}
            y={nodePositions.compute.y}
            delay={1.0}
          />
          <NetworkNode
            icon={Database}
            label="Encrypted Storage"
            x={nodePositions.storage.x}
            y={nodePositions.storage.y}
            delay={1.0}
          />
          <NetworkNode
            icon={Shield}
            label="Secure Gateway"
            x={nodePositions.gateway.x}
            y={nodePositions.gateway.y}
            delay={1.2}
          />
          <NetworkNode
            icon={BarChart3}
            label="Analytics Dashboard"
            x={nodePositions.dashboard.x}
            y={nodePositions.dashboard.y}
            delay={1.4}
          />
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          <div className="text-center space-y-3">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">End-to-End Encrypted</h3>
            <p className="text-muted-foreground">
              Individual events never leave encrypted form. Zero plaintext storage.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">GDPR Compliant</h3>
            <p className="text-muted-foreground">
              Privacy by design. No personal data collection or cookies required.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Real-Time Insights</h3>
            <p className="text-muted-foreground">
              Homomorphic computation enables live analytics on encrypted data.
            </p>
          </div>
        </motion.div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-20 max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-6 py-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              Blockchain-Verified • Open Source
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
