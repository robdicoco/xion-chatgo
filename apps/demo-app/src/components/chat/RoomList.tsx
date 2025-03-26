'use client';

import React, { useState, useEffect } from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import LoadingSpinner from './LoadingSpinner';

export default function RoomList() {
    const { rooms, currentRoom, joinRoom, createRoom, isLoading } = useChatContext();
    const { data: account } = useAbstraxionAccount();
    const [isCreating, setIsCreating] = useState(false);
    const [newParticipant, setNewParticipant] = useState('');

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newParticipant.trim() || isLoading || !account?.bech32Address) return;

        try {
            setIsCreating(true);
            const roomId = await createRoom([newParticipant.trim()]);
            await joinRoom(roomId);
            setNewParticipant('');
        } catch (error) {
            // Error is handled by ChatContext
        } finally {
            setIsCreating(false);
        }
    };

    // Reset form state when user changes
    useEffect(() => {
        setNewParticipant('');
        setIsCreating(false);
    }, [account?.bech32Address]);

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-2">Chat Rooms</h2>
                <form onSubmit={handleCreateRoom}>
                    <input
                        type="text"
                        value={newParticipant}
                        onChange={(e) => setNewParticipant(e.target.value)}
                        placeholder="Enter participant address..."
                        className="w-full px-3 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading || isCreating || !account?.bech32Address}
                    />
                    <button
                        type="submit"
                        disabled={!newParticipant.trim() || isLoading || isCreating || !account?.bech32Address}
                        className={`w-full px-4 py-2 rounded-lg ${newParticipant.trim() && !isLoading && !isCreating && account?.bech32Address
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {isCreating ? <LoadingSpinner /> : 'Create Room'}
                    </button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="space-y-2 p-2">
                        {rooms.map((room) => (
                            <button
                                key={room.id}
                                onClick={() => joinRoom(room.id)}
                                className={`w-full p-3 rounded-lg ${
                                    room.id === currentRoom
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Room {room.id}</span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(room.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
