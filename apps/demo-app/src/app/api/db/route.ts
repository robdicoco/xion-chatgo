import { NextRequest, NextResponse } from "next/server";
import DatabaseConnection from "@/lib/db/database";

export async function POST(request: NextRequest) {
    try {
        const { action, data } = await request.json();
        
        switch (action) {
            case 'getMessages':
                return NextResponse.json(await DatabaseConnection.getInstance().all(
                    'SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp DESC LIMIT 50',
                    [data.roomId]
                ));
            
            case 'getRooms':
                return NextResponse.json(await DatabaseConnection.getInstance().all(
                    'SELECT * FROM chat_rooms ORDER BY created_at DESC'
                ));
            
            case 'createRoom':
                await DatabaseConnection.getInstance().run(
                    'INSERT INTO chat_rooms (id) VALUES (?)',
                    [data.roomId]
                );
                return NextResponse.json({ success: true });
            
            case 'sendMessage':
                await DatabaseConnection.getInstance().run(
                    'INSERT INTO messages (id, sender_id, content, room_id) VALUES (?, ?, ?, ?)',
                    [data.messageId, data.senderId, data.content, data.roomId]
                );
                return NextResponse.json({ success: true });
            
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Database API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
