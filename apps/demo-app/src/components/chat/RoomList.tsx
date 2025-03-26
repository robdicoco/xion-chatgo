'use client';

import React, { useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';

export default function RoomList() {
    const { rooms, currentRoom, joinRoom, createRoom } = useChatContext();
    const { data: account } = useAbstraxionAccount();
    const [isCreating, setIsCreating] = useState(false);
    const [newParticipantId, setNewParticipantId] = useState('');

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newParticipantId.trim() || !account?.bech32Address) return;

        try {
            const roomId = await createRoom([newParticipantId.trim()]);
            joinRoom(roomId);
            setIsCreating(false);
            setNewParticipantId('');
        } catch (error) {
            console.error('Error creating room:', error);
            // You might want to show an error toast here
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    New Chat
                </button>
            </div>

            {/* Create Room Form */}
            {isCreating && (
                <div className="p-4 border-b border-gray-200">
                    <form onSubmit={handleCreateRoom} className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={newParticipantId}
                            onChange={(e) => setNewParticipantId(e.target.value)}
                            placeholder="Enter participant ID..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={!newParticipantId.trim()}
                                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewParticipantId('');
                                }}
                                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Room List */}
            <div className="flex-1 overflow-y-auto">
                {rooms.map((room) => {
                    const otherParticipant = room.participants.find(
                        (p) => p !== account?.bech32Address
                    );
                    
                    return (
                        <button
                            key={room.id}
                            onClick={() => joinRoom(room.id)}
                            className={`w-full p-4 text-left hover:bg-gray-50 ${
                                currentRoom === room.id ? 'bg-blue-50' : ''
                            }`}
                        >
                            <div className="font-medium truncate">
                                {otherParticipant ? (
                                    <span className="text-sm">
                                        {otherParticipant.slice(0, 12)}...
                                    </span>
                                ) : (
                                    <span className="text-gray-500">No participant</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                Created {new Date(room.createdAt).toLocaleDateString()}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
