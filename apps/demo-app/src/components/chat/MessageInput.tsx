'use client';

import React, { useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import LoadingSpinner from './LoadingSpinner';

export default function MessageInput() {
    const [message, setMessage] = useState('');
    const { sendMessage, isLoading } = useChatContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        try {
            await sendMessage(message.trim());
            setMessage('');
        } catch (error) {
            // Error is handled by ChatContext
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 rounded-md ${
                    message.trim() && !isLoading
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
                {isLoading ? <LoadingSpinner /> : 'Send'}
            </button>
        </form>
    );
}
