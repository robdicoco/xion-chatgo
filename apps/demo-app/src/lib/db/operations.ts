import { randomUUID } from 'crypto';
import DatabaseConnection from './database';
import { DBMessage, DBChatRoom, DBRoomParticipant, Message, ChatRoom } from '../types/chat';

export class ChatOperations {
    private static db = DatabaseConnection.getInstance();

    // Message operations
    static async createMessage(senderId: string, content: string, roomId: string): Promise<Message> {
        const id = randomUUID();
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO messages (id, sender_id, content, room_id) VALUES (?, ?, ?, ?)`,
                [id, senderId, content, roomId],
                (err) => {
                    if (err) reject(err);
                    else {
                        this.getMessageById(id)
                            .then(resolve)
                            .catch(reject);
                    }
                }
            );
        });
    }

    static async getMessageById(id: string): Promise<Message> {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM messages WHERE id = ?`,
                [id],
                (err, row: DBMessage) => {
                    if (err) reject(err);
                    else if (!row) reject(new Error('Message not found'));
                    else {
                        resolve({
                            id: row.id,
                            senderId: row.sender_id,
                            content: row.content,
                            timestamp: new Date(row.timestamp),
                            roomId: row.room_id,
                        });
                    }
                }
            );
        });
    }

    static async getRoomMessages(roomId: string): Promise<Message[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC`,
                [roomId],
                (err, rows: DBMessage[]) => {
                    if (err) reject(err);
                    else {
                        resolve(
                            rows.map((row) => ({
                                id: row.id,
                                senderId: row.sender_id,
                                content: row.content,
                                timestamp: new Date(row.timestamp),
                                roomId: row.room_id,
                            }))
                        );
                    }
                }
            );
        });
    }

    // Room operations
    static async createRoom(): Promise<string> {
        const id = randomUUID();
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO chat_rooms (id) VALUES (?)`,
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve(id);
                }
            );
        });
    }

    static async addParticipantToRoom(roomId: string, userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO room_participants (room_id, user_id) VALUES (?, ?)`,
                [roomId, userId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    static async getUserRooms(userId: string): Promise<ChatRoom[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                `
                SELECT cr.*, rp.user_id
                FROM chat_rooms cr
                JOIN room_participants rp ON cr.id = rp.room_id
                WHERE rp.room_id IN (
                    SELECT room_id 
                    FROM room_participants 
                    WHERE user_id = ?
                )
                `,
                [userId],
                async (err, rows: (DBChatRoom & { user_id: string })[]) => {
                    if (err) reject(err);
                    else {
                        const rooms = new Map<string, ChatRoom>();
                        
                        rows.forEach(row => {
                            if (!rooms.has(row.id)) {
                                rooms.set(row.id, {
                                    id: row.id,
                                    participants: [row.user_id],
                                    createdAt: new Date(row.created_at),
                                });
                            } else {
                                const room = rooms.get(row.id)!;
                                room.participants.push(row.user_id);
                            }
                        });

                        resolve(Array.from(rooms.values()));
                    }
                }
            );
        });
    }
}
