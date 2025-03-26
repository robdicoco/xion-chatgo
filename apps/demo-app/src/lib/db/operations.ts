import { randomUUID } from 'crypto';
import { Message, ChatRoom } from '../types/chat';

export class ChatOperations {
    // Message operations
    static async createMessage(senderId: string, content: string, roomId: string): Promise<Message> {
        const id = randomUUID();
        await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sendMessage',
                data: {
                    messageId: id,
                    senderId,
                    content,
                    roomId
                }
            })
        });
        const response = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getMessage', data: { messageId: id } })
        });
        return response.json();
    }

    static async getMessageById(id: string): Promise<Message> {
        const response = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getMessage', data: { messageId: id } })
        });
        return response.json();
    }

    static async getRoomMessages(roomId: string): Promise<Message[]> {
        const response = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getMessages', data: { roomId } })
        });
        return response.json();
    }

    // Room operations
    static async createRoom(): Promise<string> {
        const id = randomUUID();
        await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'createRoom', data: { roomId: id } })
        });
        return id;
    }

    static async addParticipantToRoom(roomId: string, userId: string): Promise<void> {
        await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'addParticipantToRoom',
                data: {
                    roomId,
                    userId
                }
            })
        });
    }

    static async getUserRooms(userId: string): Promise<ChatRoom[]> {
        const response = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getUserRooms', data: { userId } })
        });
        return response.json();
    }
}
