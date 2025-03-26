import { WebSocketServer, WebSocket } from 'ws';
import { ChatOperations } from '../../../lib/db/operations';
import { Message } from '../../../lib/types/chat';

const wss = new WebSocketServer({ port: parseInt(process.env.NEXT_PUBLIC_WS_PORT || '3001') });

const clients = new Map<string, WebSocket>();
const roomSubscriptions = new Map<string, Set<string>>();

wss.on('connection', (ws: WebSocket, req) => {
    const userId = new URL(req.url || '', 'ws://localhost').searchParams.get('userId');
    if (!userId) {
        ws.close();
        return;
    }

    // Store client connection
    clients.set(userId, ws);

    // Handle messages
    ws.on('message', async (data) => {
        try {
            const event = JSON.parse(data.toString());
            
            switch (event.type) {
                case 'MESSAGE': {
                    const { senderId, content, roomId } = event.payload;
                    const message = await ChatOperations.createMessage(senderId, content, roomId);
                    
                    // Broadcast to all users in the room
                    const roomClients = roomSubscriptions.get(roomId) || new Set();
                    roomClients.forEach(clientId => {
                        const clientWs = clients.get(clientId);
                        if (clientWs?.readyState === WebSocket.OPEN) {
                            clientWs.send(JSON.stringify({
                                type: 'MESSAGE',
                                payload: message
                            }));
                        }
                    });
                    break;
                }
                case 'JOIN_ROOM': {
                    const { roomId } = event.payload;
                    let roomClients = roomSubscriptions.get(roomId);
                    if (!roomClients) {
                        roomClients = new Set();
                        roomSubscriptions.set(roomId, roomClients);
                    }
                    roomClients.add(userId);

                    // Notify others in the room
                    roomClients.forEach(clientId => {
                        if (clientId !== userId) {
                            const clientWs = clients.get(clientId);
                            if (clientWs?.readyState === WebSocket.OPEN) {
                                clientWs.send(JSON.stringify({
                                    type: 'PRESENCE',
                                    payload: {
                                        userId,
                                        status: 'online',
                                        roomId
                                    }
                                }));
                            }
                        }
                    });
                    break;
                }
                case 'LEAVE_ROOM': {
                    const { roomId } = event.payload;
                    const roomClients = roomSubscriptions.get(roomId);
                    if (roomClients) {
                        roomClients.delete(userId);
                        if (roomClients.size === 0) {
                            roomSubscriptions.delete(roomId);
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        clients.delete(userId);
        
        // Remove user from all room subscriptions and notify others
        roomSubscriptions.forEach((roomClients, roomId) => {
            if (roomClients.has(userId)) {
                roomClients.delete(userId);
                roomClients.forEach(clientId => {
                    const client = clients.get(clientId);
                    if (client?.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'PRESENCE',
                            payload: {
                                userId,
                                status: 'offline',
                                roomId
                            }
                        }));
                    }
                });
            }
        });
    });
});
