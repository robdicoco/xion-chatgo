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

// Chat Context types
export interface ChatContextType {
    messages: Message[];
    rooms: ChatRoom[];
    currentRoom: string | null;
    sendMessage: (content: string) => Promise<void>;
    createRoom: (participants: string[]) => Promise<string>;
    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;
}
