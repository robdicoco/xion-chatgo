export interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: Date;
    roomId: string;
}

export interface ChatRoom {
    id: string;
    participants: string[];
    createdAt: Date;
}

export interface RoomParticipant {
    roomId: string;
    userId: string;
    joinedAt: Date;
}

export interface ChatContextType {
    messages: Message[];
    rooms: ChatRoom[];
    currentRoom: string | null;
    isLoading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<void>;
    createRoom: (participants: string[]) => Promise<string>;
    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;
}

// Database response types
export interface DBMessage {
    id: string;
    sender_id: string;
    content: string;
    timestamp: string;
    room_id: string;
}

export interface DBChatRoom {
    id: string;
    created_at: string;
}

export interface DBRoomParticipant {
    room_id: string;
    user_id: string;
    joined_at: string;
}

// WebSocket message types
export interface WebSocketMessage {
    type: 'MESSAGE' | 'JOIN_ROOM' | 'LEAVE_ROOM' | 'ROOM_UPDATE' | 'PRESENCE';
    payload: WSMessagePayload | WSRoomPayload | WSPresencePayload;
}

export interface WSMessagePayload {
    senderId: string;
    content: string;
    roomId: string;
}

export interface WSRoomPayload {
    roomId: string;
}

export interface WSPresencePayload {
    userId: string;
    status: 'online' | 'offline';
    roomId: string;
}
