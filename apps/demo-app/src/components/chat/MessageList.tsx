'use client';

import React from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';

export default function MessageList() {
    const { messages } = useChatContext();
    const { data: account } = useAbstraxionAccount();
    const listRef = React.useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages arrive
    React.useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div ref={listRef} className="flex flex-col gap-2 p-4 overflow-y-auto">
            {messages.map((message) => {
                const isOwnMessage = message.senderId === account?.bech32Address;
                
                return (
                    <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                isOwnMessage
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                            <div className="text-sm">
                                {message.content}
                            </div>
                            <div className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
