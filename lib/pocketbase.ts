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
const pb = new PocketBase(process.env.POCKETBASE_URL);
const pb_public = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
pb.autoCancellation(false);
pb_public.autoCancellation(false);
export { pb, pb_public };
