import { WelcomeMessageClient } from './WelcomeMessage.client';
import type { WelcomeMessageData } from './types';
import { useBuildSafeData } from '@/lib/buildSafeData';

/**
 * Fetches user data for the welcome message
 * In a real app, this would fetch from an API or auth session
 */
async function getUserData(): Promise<WelcomeMessageData> {
    // Mock implementation - would be replaced with actual user data retrieval
    return {
        userName: "Adam"
    };
}

/**
 * Server component that fetches user data and renders the welcome message
 */
export default async function WelcomeMessage() {
    const data = await useBuildSafeData(getUserData, { userName: "User" });
    return <WelcomeMessageClient data={data} />;
}