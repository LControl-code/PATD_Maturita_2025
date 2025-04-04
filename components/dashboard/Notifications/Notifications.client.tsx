"use client"

import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AlertTriangle, Bell, Info } from "lucide-react";
import type { NotificationsProps } from './types';

/**
 * Client component that renders a notifications card with animated entrance.
 * Displays different notification types with appropriate icons in a scrollable list.
 */
export function NotificationsClient({ data }: NotificationsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col"
        >
            <Card className="grow">
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[200px] lg:h-[300px]">
                        {data.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground">No notifications</p>
                        ) : (
                            <ul className="space-y-4">
                                {data.map((notification) => (
                                    <li key={notification.id} className="flex items-start space-x-2">
                                        {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                                        {notification.type === 'warning' && <Bell className="h-5 w-5 text-yellow-500" />}
                                        {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                                        <div>
                                            <p className="text-sm font-medium">{notification.message}</p>
                                            <p className="text-xs text-gray-500">{notification.time}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </motion.div>
    );
}