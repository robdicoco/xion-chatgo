'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { ChatContextType, Message, ChatRoom, WebSocketMessage, WSMessagePayload, WSRoomPayload } from '../lib/types/chat';
import { ChatOperations } from '../lib/db/operations';
import { webSocketService } from '../lib/websocket/WebSocketService';

// Initial state
const initialState: Omit<ChatContextType, 'sendMessage' | 'createRoom' | 'joinRoom' | 'leaveRoom'> & {
    isLoading: boolean;
    error: string | null;
} = {
    messages: [],
    rooms: [],
    currentRoom: null,
    isLoading: false,
    error: null,
};

// Action types
type ChatAction =
    | { type: 'SET_MESSAGES'; payload: Message[] }
    | { type: 'ADD_MESSAGE'; payload: Message }
    | { type: 'SET_ROOMS'; payload: ChatRoom[] }
    | { type: 'SET_CURRENT_ROOM'; payload: string | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null };

// Reducer
function chatReducer(state: typeof initialState, action: ChatAction) {
    switch (action.type) {
        case 'SET_MESSAGES':
            return { ...state, messages: action.payload, error: null };
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload], error: null };
        case 'SET_ROOMS':
            return { ...state, rooms: action.payload, error: null };
        case 'SET_CURRENT_ROOM':
            return { ...state, currentRoom: action.payload, error: null };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        default:
            return state;
    }
}

// Create context with loading and error states
const ChatContext = createContext<(ChatContextType & {
    isLoading: boolean;
    error: string | null;
}) | null>(null);

// Provider component
export function ChatProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
    const [state, dispatch] = useReducer(chatReducer, initialState);

    // Initialize WebSocket connection
    useEffect(() => {
        if (userId) {
            webSocketService.connect(userId);

            // Subscribe to WebSocket events
            const unsubscribe = webSocketService.subscribe((event: WebSocketMessage) => {
                switch (event.type) {
                    case 'MESSAGE':
                        if ((event.payload as Message).roomId === state.currentRoom) {
                            // Queue message updates to avoid state updates during render
                            const newMessages = [...state.messages, event.payload as Message];
                            dispatch({ type: 'SET_MESSAGES', payload: newMessages });
                        }
                        break;
                    case 'ROOM_UPDATE':
                        // Queue room updates to avoid state updates during render
                        ChatOperations.getUserRooms(userId).then(rooms => {
                            dispatch({ type: 'SET_ROOMS', payload: rooms });
                        });
                        break;
                }
            });

            return () => {
                unsubscribe();
                webSocketService.disconnect();
            };
        }
    }, [userId]);

    // Load user's rooms
    useEffect(() => {
        const loadRooms = async () => {
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const rooms = await ChatOperations.getUserRooms(userId);
                dispatch({ type: 'SET_ROOMS', payload: rooms });
            } catch (error) {
                console.error('Error loading rooms:', error);
                dispatch({ 
                    type: 'SET_ERROR', 
                    payload: 'Failed to load chat rooms. Please try again later.' 
                });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        loadRooms();
    }, [userId]);

    // Load messages for current room
    useEffect(() => {
        const loadMessages = async () => {
            if (state.currentRoom) {
                try {
                    const messages = await ChatOperations.getRoomMessages(state.currentRoom);
                    dispatch({ type: 'SET_MESSAGES', payload: messages });
                } catch (error) {
                    console.error('Error loading messages:', error);
                    dispatch({ 
                        type: 'SET_ERROR', 
                        payload: 'Failed to load messages. Please try again later.' 
                    });
                }
            } else {
                dispatch({ type: 'SET_MESSAGES', payload: [] });
            }
        };

        loadMessages();
    }, [state.currentRoom]);

    // Send message with loading state and WebSocket
    const sendMessage = useCallback(async (content: string) => {
        if (!state.currentRoom) {
            throw new Error('No room selected');
        }

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const messagePayload: WSMessagePayload = {
                senderId: userId,
                content,
                roomId: state.currentRoom
            };
            webSocketService.sendMessage({
                type: 'MESSAGE',
                payload: messagePayload
            });
        } catch (error) {
            console.error('Error sending message:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: 'Failed to send message. Please try again.' 
            });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.currentRoom, userId]);

    // Create room with loading state
    const createRoom = useCallback(async (participants: string[]) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const roomId = await ChatOperations.createRoom();
            await Promise.all([
                ChatOperations.addParticipantToRoom(roomId, userId),
                ...participants.map(participantId => 
                    ChatOperations.addParticipantToRoom(roomId, participantId)
                )
            ]);
            
            const rooms = await ChatOperations.getUserRooms(userId);
            dispatch({ type: 'SET_ROOMS', payload: rooms });
            
            return roomId;
        } catch (error) {
            console.error('Error creating room:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: 'Failed to create chat room. Please try again.' 
            });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [userId]);

    const joinRoom = useCallback((roomId: string) => {
        dispatch({ type: 'SET_CURRENT_ROOM', payload: roomId });
        const roomPayload: WSRoomPayload = { roomId };
        webSocketService.sendMessage({
            type: 'JOIN_ROOM',
            payload: roomPayload
        });
    }, []);

    const leaveRoom = useCallback(() => {
        if (state.currentRoom) {
            const roomPayload: WSRoomPayload = { roomId: state.currentRoom };
            webSocketService.sendMessage({
                type: 'LEAVE_ROOM',
                payload: roomPayload
            });
        }
        dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
        dispatch({ type: 'SET_MESSAGES', payload: [] });
    }, [state.currentRoom]);

    const value = {
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
