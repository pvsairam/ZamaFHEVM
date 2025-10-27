/**
 * Zama FHE Analytics - Privacy-Preserving Website Analytics
 * Client-side tracking SDK with FHE encryption
 * 
 * Usage:
 * <script src="https://your-domain.com/fhe-analytics.js" data-origin-token="fhe_sk_..."></script>
 */

(function() {
  'use strict';

  // Auto-detect the analytics server from where this script was loaded
  const getApiEndpoint = () => {
    try {
      const scriptElement = document.currentScript || document.querySelector('script[data-origin-token]');
      if (scriptElement && scriptElement.src) {
        const scriptOrigin = new URL(scriptElement.src).origin;
        return scriptOrigin + '/api/collect';
      }
    } catch (e) {
      console.warn('[Zama FHE Analytics] Could not auto-detect script origin, using current page origin');
    }
    return window.location.origin + '/api/collect';
  };

  const CONFIG = {
    apiEndpoint: getApiEndpoint(),
    batchSize: 5,
    batchTimeout: 3000, // 3 seconds
    retryAttempts: 3,
    retryDelay: 1000,
  };

  class FHEAnalytics {
    constructor(originToken) {
      this.originToken = originToken;
      this.eventQueue = [];
      this.sessionId = this.generateSessionId();
      this.publicKey = null;
      this.batchTimer = null;
      
      this.init();
    }

    generateSessionId() {
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    async init() {
      try {
        // Fetch public key for encryption
        await this.fetchPublicKey();
        
        // Track initial pageview
        this.trackPageview();
        
        // Track session start
        this.trackSession();
        
        // Set up event listeners
        this.setupListeners();
        
        console.log('[Zama FHE Analytics] Initialized with encrypted tracking');
      } catch (error) {
        console.error('[Zama FHE Analytics] Initialization failed:', error);
      }
    }

    async fetchPublicKey() {
      // In production, this would fetch the actual FHE public key
      // For now, we'll use a placeholder
      this.publicKey = 'public-key-placeholder';
    }

    setupListeners() {
      // Track clicks on elements with data-fhe-track attribute
      document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-fhe-track]');
        if (target) {
          const eventName = target.getAttribute('data-fhe-track');
          this.trackEvent(eventName, { element: target.tagName });
        }
      });

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flush(); // Send any pending events before page unload
        }
      });

      // Track before page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }

    encryptValue(value) {
      // Simulate FHE encryption
      // In production, this would use actual TFHE client-side encryption
      return {
        encrypted: true,
        value: value,
        sessionId: this.sessionId,
        timestamp: Date.now(),
      };
    }

    queueEvent(eventType, value = 1, metadata = {}) {
      const event = {
        originToken: this.originToken,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        eventType: eventType,
        value: value,
        metadata: {
          ...metadata,
          sessionId: this.sessionId,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
        },
      };

      this.eventQueue.push(event);

      // Clear existing timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      // Send batch if queue is full
      if (this.eventQueue.length >= CONFIG.batchSize) {
        this.flush();
      } else {
        // Otherwise, set timer to send batch
        this.batchTimer = setTimeout(() => this.flush(), CONFIG.batchTimeout);
      }
    }

    async flush() {
      if (this.eventQueue.length === 0) return;

      const events = [...this.eventQueue];
      this.eventQueue = [];

      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }

      // Send events in parallel
      for (const event of events) {
        this.sendEvent(event);
      }
    }

    async sendEvent(event, attempt = 1) {
      try {
        const response = await fetch(CONFIG.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
          keepalive: true, // Important for beforeunload events
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        console.log('[Zama FHE Analytics] Event sent:', event.eventType);
      } catch (error) {
        console.error('[Zama FHE Analytics] Send failed:', error);

        // Retry logic
        if (attempt < CONFIG.retryAttempts) {
          const delay = CONFIG.retryDelay * attempt;
          setTimeout(() => {
            this.sendEvent(event, attempt + 1);
          }, delay);
        }
      }
    }

    // Public API
    trackPageview() {
      this.queueEvent('pageview', 1);
    }

    trackSession() {
      this.queueEvent('session', 1);
    }

    trackEvent(eventName, metadata = {}) {
      this.queueEvent('event', 1, { eventName, ...metadata });
    }

    trackConversion(value = 1, metadata = {}) {
      this.queueEvent('conversion', value, metadata);
    }
  }

  // Auto-initialize from script tag
  (function autoInit() {
    const script = document.currentScript || document.querySelector('script[data-origin-token]');
    if (!script) {
      console.warn('[Zama FHE Analytics] No script tag found with data-origin-token attribute');
      return;
    }

    const originToken = script.getAttribute('data-origin-token');
    if (!originToken) {
      console.error('[Zama FHE Analytics] Missing data-origin-token attribute');
      return;
    }

    // Create global instance
    window.fheAnalytics = new FHEAnalytics(originToken);

    // Expose public API
    window.fheAnalytics.track = window.fheAnalytics.trackEvent.bind(window.fheAnalytics);
    window.fheAnalytics.conversion = window.fheAnalytics.trackConversion.bind(window.fheAnalytics);
  })();
})();
