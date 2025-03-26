import { WebSocketMessage, Message, WSMessagePayload, WSRoomPayload, ChatRoom } from '../types/chat';

export type WebSocketEvent = {
    type: 'MESSAGE' | 'ROOM_UPDATE' | 'PRESENCE';
    payload: any;
};

export type MessageEvent = {
    type: 'MESSAGE';
    payload: Message;
};

export type RoomUpdateEvent = {
    type: 'ROOM_UPDATE';
    payload: ChatRoom;
};

export type PresenceEvent = {
    type: 'PRESENCE';
    payload: {
        userId: string;
        status: 'online' | 'offline';
        roomId: string;
    };
};

class WebSocketService {
    private static instance: WebSocketService;
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout = 1000; // Start with 1 second
    private listeners: ((event: WebSocketMessage) => void)[] = [];

    private constructor() {}

    static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    connect(userId: string) {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = process.env.NEXT_PUBLIC_WS_PORT || '3001';
        
        this.ws = new WebSocket(`${protocol}//${host}:${port}/ws?userId=${userId}`);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.reconnectTimeout = 1000;
        };

        this.ws.onmessage = (event) => {
            try {
                const wsEvent: WebSocketMessage = JSON.parse(event.data);
                if (wsEvent.type === 'MESSAGE') {
                    // Convert WSMessagePayload to Message
                    const payload = wsEvent.payload as WSMessagePayload;
                    const message: Message = {
                        ...payload,
                        id: crypto.randomUUID(),
                        timestamp: new Date()
                    };
                    this.notifyListeners({
                        type: 'MESSAGE',
                        payload: message
                    });
                } else {
                    this.notifyListeners(wsEvent);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.handleReconnect(userId);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    private handleReconnect(userId: string) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
                this.reconnectAttempts++;
                this.reconnectTimeout *= 2; // Exponential backoff
                this.connect(userId);
            }, this.reconnectTimeout);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    subscribe(listener: (event: WebSocketMessage) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners(event: WebSocketMessage) {
        this.listeners.forEach(listener => listener(event));
    }

    sendMessage(message: WSMessagePayload | { type: string; payload: WSRoomPayload }) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const webSocketService = WebSocketService.getInstance();
