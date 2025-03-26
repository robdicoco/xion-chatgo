'use client';

import React from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import RoomList from './RoomList';
import LoadingSpinner from './LoadingSpinner';

export default function ChatWindow() {
    const { currentRoom, isLoading, error } = useChatContext();

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-lg flex flex-col">
            {error && (
                <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 px-4 py-2 text-sm">
                    {error}
                </div>
            )}
            <div className="flex h-full">
                {/* Rooms sidebar */}
                <div className="w-1/3 border-r border-gray-200 h-full">
                    <RoomList />
                </div>
                
                {/* Chat area */}
                <div className="w-2/3 flex flex-col h-full relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <LoadingSpinner />
                        </div>
                    )}
                    {currentRoom ? (
                        <>
                            <div className="flex-1 overflow-y-auto">
                                <MessageList />
                            </div>
                            <div className="p-4 border-t border-gray-200">
                                <MessageInput />
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select a chat to start messaging
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
