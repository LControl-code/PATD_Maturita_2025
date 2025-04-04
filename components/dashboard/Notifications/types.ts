/**
 * Interface for notification data structure
 */
export interface Notification {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    time: string;
}

/**
 * Props for the NotificationsClient component
 */
export interface NotificationsProps {
    data: Notification[];
}