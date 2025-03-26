'use client';

import React, { useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext';

export default function MessageInput() {
    const [message, setMessage] = useState('');
    const { sendMessage } = useChatContext();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await sendMessage(message.trim());
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            // You might want to show an error toast here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className={`px-4 py-2 rounded-lg bg-blue-500 text-white font-medium
                    ${(!message.trim() || isLoading)
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-blue-600'
                    }`}
            >
                {isLoading ? '...' : 'Send'}
            </button>
        </form>
    );
}
