# FHE-Analytics

A privacy-preserving web analytics platform that uses Fully Homomorphic Encryption. Track website metrics without ever seeing individual user data.

## What This Does

This platform lets you track website analytics while keeping user data completely private. Individual pageviews and events are encrypted in the browser before sending to your server. Your server can calculate totals without ever decrypting individual user data.

## Technologies Used

**Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, RainbowKit, Framer Motion

**Backend**: Express.js, PostgreSQL, Drizzle ORM, fhevmjs (Zama FHE library)

**Blockchain**: Smart contract on Sepolia testnet for proof verification

## Getting Started

### Step 1: Install

```bash
git clone https://github.com/pvsairam/ZamaFHEVM.git
cd ZamaFHEVM
npm install
```

### Step 2: Setup Database

You need a PostgreSQL database. Get a free one from [Neon](https://neon.tech).

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:pass@your-host.neon.tech/dbname
SESSION_SECRET=make-this-a-long-random-string
VITE_WALLETCONNECT_PROJECT_ID=get-from-walletconnect-cloud
```

Then setup the database:

```bash
npm run db:push
```

### Step 3: Start the App

```bash
npm run dev
```

Visit `http://localhost:5000` to see your analytics platform.

## How to Use

### Add Tracking to Your Website

Add this script to any website you want to track:

```html
<script src="https://your-domain.com/fhe-analytics.js" 
        data-origin-token="your-token"></script>
```

The script will automatically track pageviews and encrypt the data before sending it to your server.

### View Analytics

1. Connect your Web3 wallet on the dashboard
2. Create a new analytics origin (your website)
3. Copy the tracking token
4. Add the tracking script to your website
5. View encrypted analytics on your dashboard

### Test It Out

Visit `/demo` to see an interactive demo where you can click buttons and submit forms to generate test analytics events.

Visit `/live-demo` to see real-time analytics updating every 5 seconds.

## How the Privacy Works

**Browser**: User visits your website. The tracking script encrypts the pageview data using FHE before sending it.

**Server**: Your server receives encrypted data. It can add encrypted numbers together to get totals, but cannot see individual pageviews.

**Dashboard**: Only the final totals are decrypted and shown. Individual user data stays encrypted forever.

**Blockchain**: Daily proof digests are stored on Sepolia testnet for verification.

This means you get useful analytics totals while users maintain complete privacy.

## Project Structure

```
├── client/         Frontend React app
├── server/         Backend Express server
├── api/            Vercel serverless functions
├── contracts/      Smart contracts
├── public/         Demo page and tracking SDK
└── shared/         Database schemas
```

## API Endpoints

```
POST   /api/origins              Create analytics origin
GET    /api/origins/owner/:addr  Get origins by wallet address
POST   /api/collect              Receive encrypted events
GET    /api/metrics/:id          Get aggregated metrics
POST   /api/proofs/:id           Generate blockchain proof
```

## Deploy to Vercel

Install Vercel CLI:

```bash
npm install -g vercel
```

Login and deploy:

```bash
vercel login
vercel --prod
```

After deployment, add your environment variables in the Vercel dashboard under Settings > Environment Variables. Then redeploy.

## Database Tables

**origins**: Your registered websites
**encrypted_events**: Individual encrypted analytics (never decrypted)
**aggregates**: Decrypted totals only
**fhe_keys**: Encryption keys
**roles**: Access control

## Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production server
npm run check    # Check TypeScript types
npm run db:push  # Update database schema
```

## Key Features

**Beautiful Dashboard**: Animated hero section with smooth transitions and network topology diagram.

**Real-Time Updates**: Metrics refresh automatically every 5 seconds.

**Web3 Integration**: Connect your wallet to manage analytics origins.

**Complete Privacy**: Individual events are never decrypted. Only totals are visible.

**Easy Integration**: Add one script tag to any website to start tracking.

**Blockchain Verified**: Proof digests stored on Sepolia testnet.

## Why This Matters

Traditional analytics platforms can see every detail about your users. This platform gives you the same insights but keeps individual user data completely private through advanced encryption.

You can prove your analytics are accurate using blockchain verification, while your users maintain complete privacy.

## Built For

Zama Developer Program using Zama's fhevmjs library for Fully Homomorphic Encryption.

## License

MIT

## Quick Start Summary

```bash
# Clone and install
git clone https://github.com/pvsairam/ZamaFHEVM.git
cd ZamaFHEVM
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL

# Setup database
npm run db:push

# Start app
npm run dev
```

Your privacy-preserving analytics platform is now running at `http://localhost:5000`.
# Production ready
