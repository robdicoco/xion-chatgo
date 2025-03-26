'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { ChatContextType, Message, ChatRoom } from '../lib/types/chat';
import { ChatOperations } from '../lib/db/operations';

// Initial state
const initialState: Omit<ChatContextType, 'sendMessage' | 'createRoom' | 'joinRoom' | 'leaveRoom'> = {
    messages: [],
    rooms: [],
    currentRoom: null,
};

// Action types
type ChatAction =
    | { type: 'SET_MESSAGES'; payload: Message[] }
    | { type: 'ADD_MESSAGE'; payload: Message }
    | { type: 'SET_ROOMS'; payload: ChatRoom[] }
    | { type: 'SET_CURRENT_ROOM'; payload: string | null };

// Reducer
function chatReducer(state: typeof initialState, action: ChatAction) {
    switch (action.type) {
        case 'SET_MESSAGES':
            return { ...state, messages: action.payload };
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload] };
        case 'SET_ROOMS':
            return { ...state, rooms: action.payload };
        case 'SET_CURRENT_ROOM':
            return { ...state, currentRoom: action.payload };
        default:
            return state;
    }
}

// Create context
const ChatContext = createContext<ChatContextType | null>(null);

// Provider component
export function ChatProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
    const [state, dispatch] = useReducer(chatReducer, initialState);

    // Load user's rooms
    useEffect(() => {
        const loadRooms = async () => {
            try {
                const rooms = await ChatOperations.getUserRooms(userId);
                dispatch({ type: 'SET_ROOMS', payload: rooms });
            } catch (error) {
                console.error('Error loading rooms:', error);
            }
        };
        loadRooms();
    }, [userId]);

    // Load messages when current room changes
    useEffect(() => {
        const loadMessages = async () => {
            if (state.currentRoom) {
                try {
                    const messages = await ChatOperations.getRoomMessages(state.currentRoom);
                    dispatch({ type: 'SET_MESSAGES', payload: messages });
                } catch (error) {
                    console.error('Error loading messages:', error);
                }
            }
        };
        loadMessages();
    }, [state.currentRoom]);

    // Send message
    const sendMessage = useCallback(async (content: string) => {
        if (!state.currentRoom) {
            throw new Error('No room selected');
        }
        try {
            const message = await ChatOperations.createMessage(userId, content, state.currentRoom);
            dispatch({ type: 'ADD_MESSAGE', payload: message });
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }, [state.currentRoom, userId]);

    // Create room
    const createRoom = useCallback(async (participants: string[]) => {
        try {
            const roomId = await ChatOperations.createRoom();
            // Add all participants including the creator
            await Promise.all([
                ChatOperations.addParticipantToRoom(roomId, userId),
                ...participants.map(participantId => 
                    ChatOperations.addParticipantToRoom(roomId, participantId)
                )
            ]);
            
            // Refresh rooms list
            const rooms = await ChatOperations.getUserRooms(userId);
            dispatch({ type: 'SET_ROOMS', payload: rooms });
            
            return roomId;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }, [userId]);

    // Join room
    const joinRoom = useCallback((roomId: string) => {
        dispatch({ type: 'SET_CURRENT_ROOM', payload: roomId });
    }, []);

    // Leave room
    const leaveRoom = useCallback(() => {
        dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
        dispatch({ type: 'SET_MESSAGES', payload: [] });
    }, []);

    const value: ChatContextType = {
        ...state,
        sendMessage,
        createRoom,
        joinRoom,
        leaveRoom,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Custom hook to use the chat context
export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
}
