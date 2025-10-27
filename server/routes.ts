import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import * as path from "path";
import { storage } from "./storage";
import { generateFHEKeyPair, generateOriginToken, encryptValue, decryptValue, homomorphicSum, generateProofDigest } from "./fhe";
import { z } from "zod";
import { insertOriginSchema, insertEncryptedEventSchema, insertAggregateSchema, insertRoleSchema } from "@shared/schema";

// SSE clients map: originId -> Set of response objects
const sseClients = new Map<string, Set<Response>>();

// Helper to send SSE update to all connected clients for an origin
function broadcastMetricsUpdate(originId: string, metrics: any) {
  const clients = sseClients.get(originId);
  if (!clients) return;
  
  const data = JSON.stringify(metrics);
  clients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('[SSE] Failed to send update:', error);
      clients.delete(client);
    }
  });
}

// Serverless-compatible route registration (no HTTP server creation)
export async function registerServerlessRoutes(app: Express): Promise<void> {
  await registerRoutesInternal(app, true); // Skip file serving
}

// Traditional server route registration (creates HTTP server)
export async function registerRoutes(app: Express): Promise<Server> {
  await registerRoutesInternal(app, false); // Include file serving
  const httpServer = createServer(app);
  return httpServer;
}

// Internal route registration logic (shared by both)
async function registerRoutesInternal(app: Express, skipFileServing: boolean = false): Promise<void> {
  // Serve tracking script (only in local dev - skip in serverless)
  if (!skipFileServing) {
    app.get("/fhe-analytics.js", (_req, res) => {
      res.sendFile(path.join(process.cwd(), "public", "fhe-analytics.js"));
    });

    // Serve demo page (only in local dev - skip in serverless)
    app.get("/demo", (_req, res) => {
      res.sendFile(path.join(process.cwd(), "public", "demo.html"));
    });
  }

  // Get or create demo origin (no wallet required for testing)
  app.get("/api/demo/origin", async (_req, res) => {
    try {
      const demoOriginDomain = "demo.fhe-analytics.app";
      const demoOwnerAddress = "0x0000000000000000000000000000000000000000"; // Placeholder address
      
      // Check if demo origin already exists
      let origins = await storage.getOriginsByOwner(demoOwnerAddress);
      let demoOrigin = origins.find(o => o.domain === demoOriginDomain);
      
      if (!demoOrigin) {
        // Create demo origin
        const token = generateOriginToken();
        const keyPair = generateFHEKeyPair();
        
        demoOrigin = await storage.createOrigin({
          domain: demoOriginDomain,
          ownerAddress: demoOwnerAddress,
          token,
        });

        // Store FHE public key
        await storage.createFheKey({
          originId: demoOrigin.id,
          publicKey: keyPair.publicKey,
          keyFingerprint: keyPair.fingerprint,
          isActive: 'true',
        });

        // Create owner role
        await storage.createRole({
          originId: demoOrigin.id,
          address: demoOwnerAddress,
          email: null,
          role: 'owner',
        });
        
        console.log('[API] Created demo origin:', demoOrigin.id);
      }
      
      res.json({
        origin: demoOrigin,
        token: demoOrigin.token,
      });
    } catch (error) {
      console.error('[API] Demo origin error:', error);
      res.status(500).json({ error: 'Failed to create demo origin' });
    }
  });

  // Health check with database test
  app.get("/api/health", async (_req, res) => {
    try {
      const origins = await storage.getOriginsByOwner("test");
      res.json({ 
        status: "ok", 
        fhe: "enabled", 
        realtime: "sse",
        database: "connected",
        tableCount: origins.length >= 0 ? "✓" : "✗"
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        database: "failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create new origin
  app.post("/api/origins", async (req, res) => {
    try {
      console.log('[API] Create origin request:', { body: req.body });
      const body = insertOriginSchema.parse(req.body);
      console.log('[API] Schema validation passed');
      
      // Generate token and FHE keys for new origin
      const token = generateOriginToken();
      console.log('[API] Token generated');
      const keyPair = generateFHEKeyPair();
      console.log('[API] FHE keys generated');
      
      // Create origin
      const origin = await storage.createOrigin({
        ...body,
        token,
      });
      console.log('[API] Origin created:', origin.id);

      // Store FHE public key
      await storage.createFheKey({
        originId: origin.id,
        publicKey: keyPair.publicKey,
        keyFingerprint: keyPair.fingerprint,
        isActive: 'true',
      });
      console.log('[API] FHE key stored');

      // Create owner role
      await storage.createRole({
        originId: origin.id,
        address: body.ownerAddress,
        email: null,
        role: 'owner',
      });
      console.log('[API] Owner role created');

      res.json({
        origin,
        token,
        publicKeyFingerprint: keyPair.fingerprint,
      });
    } catch (error) {
      console.error('[API] Create origin error:', error);
      console.error('[API] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      
      // Return detailed error for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ 
        error: 'Failed to create origin',
        details: errorMessage,
      });
    }
  });

  // Get origins by owner
  app.get("/api/origins/owner/:address", async (req, res) => {
    try {
      const { address } = req.params;
      console.log('[API] Get origins by owner:', address);
      const origins = await storage.getOriginsByOwner(address);
      console.log('[API] Found origins:', origins.length);
      res.json(origins);
    } catch (error) {
      console.error('[API] Get origins error:', error);
      console.error('[API] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Server error', details: errorMessage });
    }
  });

  // Delete origin
  app.delete("/api/origins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[API] Delete origin request:', id);
      
      // Verify origin exists
      const origin = await storage.getOriginById(id);
      if (!origin) {
        return res.status(404).json({ error: 'Origin not found' });
      }

      // Delete the origin (cascades to related data)
      await storage.deleteOrigin(id);
      console.log('[API] Origin deleted successfully:', id);
      
      res.json({ success: true, message: 'Origin deleted' });
    } catch (error) {
      console.error('[API] Delete origin error:', error);
      console.error('[API] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to delete origin', details: errorMessage });
    }
  });

  // Get public key for origin
  app.get("/api/keys/:originId/current", async (req, res) => {
    try {
      const { originId } = req.params;
      console.log('[API] Get key for origin:', originId);
      const key = await storage.getActiveKey(originId);
      
      if (!key) {
        console.log('[API] No active key found for origin:', originId);
        return res.status(404).json({ error: 'No active key found' });
      }

      console.log('[API] Key found:', key.keyFingerprint);
      res.json({
        publicKey: key.publicKey,
        fingerprint: key.keyFingerprint,
        id: key.id,
      });
    } catch (error) {
      console.error('[API] Get key error:', error);
      console.error('[API] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Server error', details: errorMessage });
    }
  });

  // Collect encrypted event with real-time updates
  app.post("/api/collect", async (req, res) => {
    try {
      const schema = z.object({
        originToken: z.string(),
        timestamp: z.string().datetime(),
        page: z.string(),
        eventType: z.enum(['pageview', 'session', 'conversion', 'event']),
        value: z.number().optional(),
        metadata: z.any().optional(),
      });

      const body = schema.parse(req.body);
      
      // Verify origin token
      const origin = await storage.getOriginByToken(body.originToken);
      if (!origin) {
        return res.status(401).json({ error: 'Invalid origin token' });
      }

      // Get active key
      const key = await storage.getActiveKey(origin.id);
      if (!key) {
        return res.status(500).json({ error: 'No encryption key configured' });
      }

      // Encrypt value (simulated FHE encryption)
      const value = body.value || 1;
      const cipherBlob = encryptValue(value, key.publicKey);

      // Store encrypted event
      await storage.createEncryptedEvent({
        originId: origin.id,
        timestamp: new Date(body.timestamp),
        page: body.page,
        eventType: body.eventType,
        cipherBlob,
        metadata: body.metadata || null,
      });

      // Immediately compute and broadcast updated metrics
      setImmediate(async () => {
        try {
          const events = await storage.getEventsByOrigin(origin.id, 1000);
          
          const pageviewEvents = events.filter(e => e.eventType === 'pageview');
          const sessionEvents = events.filter(e => e.eventType === 'session');
          const conversionEvents = events.filter(e => e.eventType === 'conversion');

          const pageviewsCipher = pageviewEvents.length > 0 
            ? homomorphicSum(pageviewEvents.map(e => e.cipherBlob))
            : Buffer.from(JSON.stringify({ value: 0, encrypted: true }));

          const sessionsCipher = sessionEvents.length > 0
            ? homomorphicSum(sessionEvents.map(e => e.cipherBlob))
            : Buffer.from(JSON.stringify({ value: 0, encrypted: true }));

          const conversionsCipher = conversionEvents.length > 0
            ? homomorphicSum(conversionEvents.map(e => e.cipherBlob))
            : Buffer.from(JSON.stringify({ value: 0, encrypted: true }));

          const pageviews = decryptValue(pageviewsCipher, '');
          const sessions = decryptValue(sessionsCipher, '');
          const conversions = decryptValue(conversionsCipher, '');

          const visitors = Math.floor(sessions * 0.7);
          const avgSession = sessions > 0 ? Math.floor(pageviews / sessions) : 0;

          broadcastMetricsUpdate(origin.id, {
            metrics: {
              visitors,
              pageviews,
              sessions,
              avgSession,
              conversions,
              encrypted: true,
            },
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('[SSE] Failed to broadcast update:', error);
        }
      });

      res.status(202).json({ 
        accepted: true,
        encrypted: true,
        realtime: true,
        message: 'Event encrypted and processed',
      });
    } catch (error) {
      console.error('[API] Collect error:', error);
      res.status(400).json({ error: 'Invalid request' });
    }
  });

  // SSE endpoint for real-time metrics
  app.get("/api/metrics/:originId/stream", (req, res) => {
    const { originId } = req.params;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Add client to set
    if (!sseClients.has(originId)) {
      sseClients.set(originId, new Set());
    }
    sseClients.get(originId)!.add(res);

    console.log(`[SSE] Client connected for origin ${originId}`);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ connected: true, originId })}\n\n`);

    // Clean up on disconnect
    req.on('close', () => {
      const clients = sseClients.get(originId);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) {
          sseClients.delete(originId);
        }
      }
      console.log(`[SSE] Client disconnected from origin ${originId}`);
    });
  });

  // Get metrics (aggregated)
  app.get("/api/metrics/:originId", async (req, res) => {
    try {
      const { originId } = req.params;
      const { startDate, endDate } = req.query;

      // Get recent events for homomorphic aggregation
      const events = await storage.getEventsByOrigin(originId, 1000);
      
      // Simulate homomorphic aggregation
      const pageviewEvents = events.filter(e => e.eventType === 'pageview');
      const sessionEvents = events.filter(e => e.eventType === 'session');
      const conversionEvents = events.filter(e => e.eventType === 'conversion');

      // Compute encrypted sums
      const pageviewsCipher = pageviewEvents.length > 0 
        ? homomorphicSum(pageviewEvents.map(e => e.cipherBlob))
        : Buffer.from(JSON.stringify({ value: 0, encrypted: true }));

      const sessionsCipher = sessionEvents.length > 0
        ? homomorphicSum(sessionEvents.map(e => e.cipherBlob))
        : Buffer.from(JSON.stringify({ value: 0, encrypted: true }));

      const conversionsCipher = conversionEvents.length > 0
        ? homomorphicSum(conversionEvents.map(e => e.cipherBlob))
        : Buffer.from(JSON.stringify({ value: 0, encrypted: true }));

      // Decrypt ONLY aggregates (privacy-preserving)
      const pageviews = decryptValue(pageviewsCipher, '');
      const sessions = decryptValue(sessionsCipher, '');
      const conversions = decryptValue(conversionsCipher, '');

      // Calculate derived metrics
      const visitors = Math.floor(sessions * 0.7); // Rough estimate
      const avgSession = sessions > 0 ? Math.floor(pageviews / sessions) : 0;
      const bounceRate = sessions > 0 ? Math.floor((1 - (avgSession / pageviews)) * 100) : 0;

      // Time series - group events by date (last 7 days)
      const dateGroups = events.reduce((acc, event) => {
        const date = event.timestamp.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { pageviews: 0, sessions: 0 };
        }
        if (event.eventType === 'pageview') acc[date].pageviews++;
        if (event.eventType === 'session') acc[date].sessions++;
        return acc;
      }, {} as Record<string, { pageviews: number; sessions: number }>);

      // Get last 7 days and populate with data
      const now = new Date();
      const timeSeries = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const data = dateGroups[dateStr] || { pageviews: 0, sessions: 0 };
        return {
          date: dateStr,
          visitors: Math.floor(data.sessions * 0.7),
          pageviews: data.pageviews,
        };
      });

      // Top pages
      const pageGroups = events.reduce((acc, event) => {
        acc[event.page] = (acc[event.page] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topPages = Object.entries(pageGroups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([page, views]) => ({ page, views, encrypted: true }));

      res.json({
        metrics: {
          visitors,
          pageviews,
          sessions,
          avgSession,
          bounceRate,
          conversions,
          encrypted: true,
        },
        timeSeries,
        topPages,
      });
    } catch (error) {
      console.error('[API] Get metrics error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Generate proof for on-chain anchoring
  app.post("/api/proofs/:originId", async (req, res) => {
    try {
      const { originId } = req.params;
      const { day } = req.body;

      // Get aggregates for the day
      const aggregates = await storage.getAggregatesByDay(originId, new Date(day));
      
      // Generate proof digest
      const aggregateData = aggregates.reduce((acc, agg) => {
        if (agg.valuePlain) {
          acc[agg.metric] = parseInt(agg.valuePlain, 10);
        }
        return acc;
      }, {} as Record<string, number>);

      const digest = generateProofDigest(aggregateData);

      res.json({
        digest,
        cid: `Qm${crypto.randomBytes(22).toString('hex')}`, // Mock IPFS CID
        aggregates: aggregateData,
        verified: true,
      });
    } catch (error) {
      console.error('[API] Generate proof error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
}
