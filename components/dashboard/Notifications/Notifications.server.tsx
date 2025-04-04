import { NotificationsClient } from './Notifications.client';
import type { Notification } from './types';
import {useBuildSafeData} from "@/lib/buildSafeData";

/**
 * Fetches notification data from the appropriate source
 * Currently uses mock data but would be replaced with real API calls
 */
async function getNotifications(): Promise<Notification[]> {
    // In production, we'd likely fetch from an API endpoint or database
    // For now, we'll continue using the mock data

    // Mock data - would be replaced with actual API call in production
    const notifications: Notification[] = [
        { id: "1", type: 'error', message: 'Critical error in A26: Voltage Fluctuation', time: '2 minutes ago' },
        { id: "2", type: 'warning', message: 'Maintenance required for S02: Temperature Overload', time: '1 hour ago' },
        { id: "3", type: 'info', message: 'New software update available: Version 2.1.0', time: '3 hours ago' },
        { id: "4", type: 'error', message: 'Power fluctuation detected in R23: Pressure Drop', time: '5 hours ago' },
        { id: "5", type: 'info', message: 'Scheduled maintenance for A26 at 3:00 PM', time: '6 hours ago' },
        { id: "6", type: 'warning', message: 'High humidity levels detected in S02: Humidity Spike', time: '8 hours ago' },
        { id: "7", type: 'error', message: 'Unexpected power loss in A26: Power Loss', time: '10 hours ago' },
        { id: "8", type: 'info', message: 'New training module available for station operators', time: '12 hours ago' },
        { id: "9", type: 'warning', message: 'Speed deviation detected in S02: Speed Deviation', time: '14 hours ago' },
        { id: "10", type: 'error', message: 'Vibration anomaly detected in R23: Vibration Anomaly', time: '16 hours ago' },
    ];

    return notifications;
}

/**
 * Server component that handles fetching notification data
 * and passing it to the client component for rendering
 */
export default async function Notifications() {
    const data = await useBuildSafeData(getNotifications, []);
    return <NotificationsClient data={data} />;
}