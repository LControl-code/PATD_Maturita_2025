import { EventEmitter } from 'node:events';
import { pb } from './pocketbase';
import { revalidateTag } from 'next/cache';

export enum DBEventType {
    TEST_DATA_UPDATE = 'TEST_DATA_UPDATE',
}

// Whichever tags you want to revalidate:
const ERROR_TAGS = ['live_errors_tag', 'top_fails_tag', 'failed_tests_tag'];
// Adjust debounce time as needed
const DEBOUNCE_MS = 5000;

/**
 * A class that extends EventEmitter to handle database updates and revalidation.
 * Implements a debounced event emission system for database changes.
 * 
 * @extends EventEmitter
 * @class
 * 
 * @property {boolean} isWatching - Indicates if the watcher is currently active
 * @property {NodeJS.Timeout | null} debounceTimer - Timer for debouncing update events
 * 
 * @emits {DBEventType.TEST_DATA_UPDATE} - Emitted when database changes are detected (after debounce)
 * 
 * @remarks
 * - Uses PocketBase subscription to watch for database changes
 * - Implements debouncing to prevent rapid successive updates
 * - Automatically revalidates associated tags in Next.js after updates
 */
class DbUpdatesEmitter extends EventEmitter {
    private isWatching = false;
    private debounceTimer: NodeJS.Timeout | null = null;

    constructor() {
        super();
        // console.log('[DEBUG] DbUpdatesEmitter constructor called');
        this.initWatcher();
    }

    private initWatcher() {
        if (this.isWatching) {
            // console.log('[DEBUG] Already watching "test_data", skipping');
            return;
        }
        this.isWatching = true;

        // console.log('[DEBUG] Setting up pb.collection("test_data").subscribe("*")');

        pb.collection('test_data').subscribe('*', (e) => {
            // console.log('[DEBUG] PB subscription triggered');

            // Clear any existing debounce
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            // Start a new debounce
            this.debounceTimer = setTimeout(async () => {
                // console.log('[DEBUG] Debounce fired, emitting TEST_DATA_UPDATE event');
                this.emit(DBEventType.TEST_DATA_UPDATE, e);

                // Revalidate each tag to force Next.js to refetch associated data
                for (const tag of ERROR_TAGS) {
                    // console.log(`[DEBUG] Revalidating tag: ${tag}`);
                    try {
                        await revalidateTag(tag); // handle the promise
                    } catch (err) {
                        // console.error(`[DEBUG] Failed to revalidate tag "${tag}":`, err);
                    }
                }
            }, DEBOUNCE_MS);
        });
    }
}

// Ensure a single global instance
let globalEmitter: DbUpdatesEmitter;

export function getDbUpdatesEmitter(): DbUpdatesEmitter {
    if (!globalEmitter) {
        // console.log('[DEBUG] Creating a new DbUpdatesEmitter instance');
        globalEmitter = new DbUpdatesEmitter();
    } else {
        // console.log('[DEBUG] Returning existing DbUpdatesEmitter instance');
    }
    return globalEmitter;
}
