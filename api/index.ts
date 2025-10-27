import { neon } from '@neondatabase/serverless';

// Force Node.js runtime
export const config = {
  runtime: 'nodejs',
};

// Simple crypto utilities
function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `fhe_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

function randomUUID() {
  return crypto.randomUUID();
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse URL (strip query params)
  const url = req.url?.split('?')[0] || '/';
  const method = req.method;
  
  console.log('[API]', method, url);
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);

    // Health check
    if (url === '/api' || url === '/api/' || url === '/api/health') {
      const result = await sql`SELECT COUNT(*) as count FROM origins`;
      return res.status(200).json({ 
        status: 'ok', 
        database: 'connected',
        origins: parseInt(result[0]?.count || '0'),
      });
    }

    // Create origin
    if (url === '/api/origins' && method === 'POST') {
      const { domain, ownerAddress } = req.body;
      
      if (!domain || !ownerAddress) {
        return res.status(400).json({ error: 'Missing domain or ownerAddress' });
      }
      
      const token = randomToken();
      const originId = randomUUID();
      
      // Insert origin
      const [origin] = await sql`
        INSERT INTO origins (id, domain, owner_address, token, created_at, updated_at)
        VALUES (${originId}, ${domain}, ${ownerAddress}, ${token}, NOW(), NOW())
        RETURNING *
      `;
      
      // Create FHE key (simplified - just a placeholder)
      await sql`
        INSERT INTO fhe_keys (id, origin_id, public_key, key_fingerprint, is_active, created_at)
        VALUES (${randomUUID()}, ${originId}, 'placeholder-key', 'placeholder-fingerprint', 'true', NOW())
      `;
      
      // Create owner role
      await sql`
        INSERT INTO roles (id, origin_id, address, role, created_at)
        VALUES (${randomUUID()}, ${originId}, ${ownerAddress}, 'owner', NOW())
      `;
      
      return res.status(201).json(origin);
    }

    // Get origins by owner
    if (url.startsWith('/api/origins/owner/') && method === 'GET') {
      const address = url.split('/').pop();
      const origins = await sql`
        SELECT * FROM origins 
        WHERE owner_address = ${address}
        ORDER BY created_at DESC
      `;
      return res.status(200).json(origins);
    }

    // Delete origin
    if (url.startsWith('/api/origins/') && method === 'DELETE') {
      const originId = url.split('/').pop();
      
      // Verify origin exists
      const [origin] = await sql`
        SELECT id FROM origins WHERE id = ${originId} LIMIT 1
      `;
      
      if (!origin) {
        return res.status(404).json({ error: 'Origin not found' });
      }
      
      // Delete origin (cascades to related data via foreign key constraints)
      await sql`DELETE FROM origins WHERE id = ${originId}`;
      
      console.log('[DELETE] Origin deleted:', originId);
      return res.status(200).json({ success: true, message: 'Origin deleted' });
    }

    // Get FHE key
    if (url.match(/\/api\/keys\/[\w-]+\/current/) && method === 'GET') {
      const originId = url.split('/')[3];
      const [key] = await sql`
        SELECT public_key FROM fhe_keys 
        WHERE origin_id = ${originId} AND is_active = 'true'
        LIMIT 1
      `;
      
      if (!key) {
        return res.status(404).json({ error: 'Key not found' });
      }
      
      return res.status(200).json({ publicKey: key.public_key });
    }

    // Collect event
    if (url === '/api/collect' && method === 'POST') {
      const { originToken, page, eventType, value, metadata } = req.body;
      
      if (!originToken) {
        return res.status(400).json({ error: 'Missing originToken' });
      }
      
      // Look up origin by token
      const [origin] = await sql`
        SELECT id FROM origins WHERE token = ${originToken} LIMIT 1
      `;
      
      if (!origin) {
        return res.status(404).json({ error: 'Invalid origin token' });
      }
      
      // Create simulated encrypted blob (JSON stringified for demo)
      const encryptedData = JSON.stringify({
        value: value || 1,
        metadata,
        encrypted: true,
        timestamp: Date.now()
      });
      
      const eventId = randomUUID();
      await sql`
        INSERT INTO encrypted_events (id, origin_id, timestamp, page, event_type, cipher_blob, created_at)
        VALUES (${eventId}, ${origin.id}, NOW(), ${page}, ${eventType}, ${encryptedData}, NOW())
      `;
      
      console.log('[COLLECT] Event stored:', eventType, 'for origin:', origin.id);
      return res.status(201).json({ id: eventId, status: 'encrypted' });
    }

    // Demo origin endpoint
    if (url === '/api/demo/origin' && method === 'GET') {
      // Find or create demo origin
      let [demoOrigin] = await sql`
        SELECT * FROM origins WHERE domain = 'demo.fhe-analytics.app' LIMIT 1
      `;
      
      if (!demoOrigin) {
        // Create demo origin
        const token = randomToken();
        const originId = randomUUID();
        
        [demoOrigin] = await sql`
          INSERT INTO origins (id, domain, owner_address, token, created_at, updated_at)
          VALUES (${originId}, 'demo.fhe-analytics.app', '0x0000000000000000000000000000000000000000', ${token}, NOW(), NOW())
          RETURNING *
        `;
        
        // Create FHE key
        await sql`
          INSERT INTO fhe_keys (id, origin_id, public_key, key_fingerprint, is_active, created_at)
          VALUES (${randomUUID()}, ${originId}, 'demo-public-key', 'demo-fingerprint', 'true', NOW())
        `;
      }
      
      return res.status(200).json({
        origin: demoOrigin,
        token: demoOrigin.token
      });
    }

    // Get metrics
    if (url.match(/\/api\/metrics\/[\w-]+/) && method === 'GET') {
      const originId = url.split('/').pop();
      
      const events = await sql`
        SELECT event_type FROM encrypted_events 
        WHERE origin_id = ${originId}
        LIMIT 1000
      `;

      const metrics = {
        visitors: events.filter((e: any) => e.event_type === 'visitor').length,
        pageviews: events.filter((e: any) => e.event_type === 'pageview').length,
        sessions: events.filter((e: any) => e.event_type === 'session').length,
        conversions: events.filter((e: any) => e.event_type === 'conversion').length,
      };

      return res.status(200).json({ metrics });
    }

    return res.status(404).json({ error: 'Not found' });
    
  } catch (error: any) {
    console.error('[ERROR]', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error?.message || String(error),
    });
  }
}
