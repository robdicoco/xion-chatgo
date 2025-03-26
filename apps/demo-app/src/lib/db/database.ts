import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'chat.db');

class DatabaseConnection {
    private static instance: Database;

    public static getInstance(): Database {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                } else {
                    console.log('Connected to SQLite database');
                    // Initialize tables
                    DatabaseConnection.initTables();
                }
            });
        }
        return DatabaseConnection.instance;
    }

    private static initTables(): void {
        const db = DatabaseConnection.getInstance();
        
        // Create tables if they don't exist
        db.serialize(() => {
            // Chat Rooms Table
            db.run(`
                CREATE TABLE IF NOT EXISTS chat_rooms (
                    id TEXT PRIMARY KEY,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Messages Table
            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    sender_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    room_id TEXT NOT NULL,
                    FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
                )
            `);

            // Room Participants Table
            db.run(`
                CREATE TABLE IF NOT EXISTS room_participants (
                    room_id TEXT,
                    user_id TEXT,
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (room_id, user_id),
                    FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
                )
            `);
        });
    }

    public static closeConnection(): void {
        if (DatabaseConnection.instance) {
            DatabaseConnection.instance.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

export default DatabaseConnection;
