import crypto from 'crypto';

class EventBusService {
  constructor() {
    this.listeners = new Set();
    this.eventStore = [];
    
    // Seed initial system registration events to represent starting workloads
    this.seedInitialEvents();
  }

  // Schema Validator
  validateEvent(event) {
    if (!event) throw new Error('Event payload is empty');
    
    const { header, context, payload, path_metadata } = event;
    
    if (!header || !header.event_id || !header.timestamp || !header.agent_id || !header.event_type) {
      throw new Error('Invalid JSON-LD header: event_id, timestamp, agent_id, and event_type are required');
    }
    
    if (!context || !context.resource_id || !context.environment) {
      throw new Error('Invalid JSON-LD context: resource_id and environment are required');
    }
    
    if (!payload || !payload.category || !payload.finding || !payload.severity) {
      throw new Error('Invalid JSON-LD payload: category, finding, and severity are required');
    }
    
    if (!path_metadata || typeof path_metadata.is_critical_path !== 'boolean' || typeof path_metadata.exploitability_score !== 'number') {
      throw new Error('Invalid JSON-LD path_metadata: is_critical_path (boolean) and exploitability_score (number) are required');
    }
    
    return true;
  }

  // Subscribe a listener callback (e.g. SSE stream router)
  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Publish event to all subscribers and append to eventStore (DB)
  publish(event) {
    // Generate IDs/timestamps if not present
    const sanitizedEvent = {
      ...event,
      header: {
        event_id: event.header?.event_id || crypto.randomUUID(),
        timestamp: event.header?.timestamp || new Date().toISOString(),
        agent_id: event.header?.agent_id || 'sentinel-observer-daemon',
        event_type: event.header?.event_type || 'unclassified_telemetry'
      }
    };

    this.validateEvent(sanitizedEvent);
    
    this.eventStore.push(sanitizedEvent);
    
    // Notify all active stream connections
    for (const listener of this.listeners) {
      try {
        listener(sanitizedEvent);
      } catch (err) {
        console.error('Error broadcasting event to listener:', err);
      }
    }
    
    return sanitizedEvent;
  }

  // Query Event Store history
  getHistory() {
    return [...this.eventStore];
  }

  // Clear event history
  clearStore() {
    this.eventStore = [];
    this.seedInitialEvents();
  }

  // Seed initial registration events
  seedInitialEvents() {
    const workloads = [
      { id: 'workload-dev-discovery', label: 'Discovery Asset VM', service: 'UAT Dev Env' },
      { id: 'workload-finance-ai', label: 'Finance Auto-Billing Agent', service: 'AI Agent Runtime' },
      { id: 'workload-database-core', label: 'Customer Root Database', service: 'Data Store' },
      { id: 'workload-vpn', label: 'VPN Access Gateway', service: 'Network perimeter' }
    ];

    workloads.forEach((w, index) => {
      const now = new Date(Date.now() - (60000 * (workloads.length - index))).toISOString();
      const registrationEvent = {
        header: {
          event_id: `seed-uuid-reg-${w.id}`,
          timestamp: now,
          agent_id: `sidecar-observer-${w.id}`,
          event_type: 'agent_registration'
        },
        context: {
          resource_id: w.id,
          environment: 'production-k8s-cluster'
        },
        payload: {
          category: 'Telemetry Agent Registration',
          finding: `Sidecar observer daemon registered successfully on ${w.label} workload.`,
          severity: 'INFO',
          evidence: {
            serviceName: w.service,
            kernelVersion: 'Linux 5.15.0-72-generic',
            sidecarVersion: 'sentinel-v1.0.4-release'
          }
        },
        path_metadata: {
          is_critical_path: false,
          exploitability_score: 0.0
        }
      };
      
      this.eventStore.push(registrationEvent);
    });
  }
}

// Global Singleton pattern to maintain event states across Next.js API reloads
if (!global._sentinelEventBus) {
  global._sentinelEventBus = new EventBusService();
}

export const EventBus = global._sentinelEventBus;
