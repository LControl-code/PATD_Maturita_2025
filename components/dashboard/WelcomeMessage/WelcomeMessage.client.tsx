"use client"

import React from 'react';
import { motion } from 'framer-motion';
import type { WelcomeMessageProps } from './types';

/**
 * Client component that renders the welcome message with animation
 */
export function WelcomeMessageClient({ data }: WelcomeMessageProps) {
    return (
        <motion.h1
            className="text-3xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            Welcome back, {data.userName}!
        </motion.h1>
    );
}