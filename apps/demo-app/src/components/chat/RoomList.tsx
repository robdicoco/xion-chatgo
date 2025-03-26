'use client';

import React, { useState } from 'react';
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
        if (!newParticipant.trim() || isLoading) return;

        try {
            setIsCreating(true);
            const roomId = await createRoom([newParticipant.trim()]);
            joinRoom(roomId);
            setNewParticipant('');
        } catch (error) {
            // Error is handled by ChatContext
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-2">Chat Rooms</h2>
                <form onSubmit={handleCreateRoom}>
                    <input
                        type="text"
                        value={newParticipant}
                        onChange={(e) => setNewParticipant(e.target.value)}
                        placeholder="Enter participant address..."
                        className="w-full px-3 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading || isCreating}
                    />
                    <button
                        type="submit"
                        disabled={!newParticipant.trim() || isLoading || isCreating}
                        className={`w-full px-4 py-2 rounded-lg ${
                            newParticipant.trim() && !isLoading && !isCreating
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isCreating ? <LoadingSpinner /> : 'Create Room'}
                    </button>
                </form>
            </div>
            {/* Room List */}
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="text-center text-gray-500 mt-4">
                        No chat rooms yet
                    </div>
                ) : (
                    <div className="space-y-2">
                        {rooms.map((room) => {
                            const otherParticipant = room.participants.find(
                                (p) => p !== account?.bech32Address
                            );
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => joinRoom(room.id)}
                                    className={`w-full p-3 text-left rounded-lg transition-colors ${
                                        currentRoom === room.id
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="font-medium">
                                        {otherParticipant ? (
                                            <span>
                                                {otherParticipant.slice(0, 12)}...
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">No participant</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Created {new Date(room.createdAt).toLocaleDateString()}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
