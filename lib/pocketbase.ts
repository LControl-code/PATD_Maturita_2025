// lib/pocketbase.ts
import PocketBase from 'pocketbase';
import { EventSource } from 'eventsource';

if (!globalThis.EventSource) {
    globalThis.EventSource = EventSource;
}

/**
 * PocketBase instance for database operations
 * Connects to the PocketBase server using the URL from environment variables,
 * falling back to localhost if not specified
 * @constant
 * @type {PocketBase}
 */
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
pb.autoCancellation(false);
export default pb;
