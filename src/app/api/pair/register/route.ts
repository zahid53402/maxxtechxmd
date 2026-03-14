import { NextResponse } from 'next/server';
import makeWASocket, { DisconnectReason, initAuthCreds, proto } from '@whiskeysockets/baileys';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

let client: MongoClient | null = null;

async function getDb() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://maxxbot:maxxbot2020@clustersessions.pcz8pqh.mongodb.net/maxx-xmd?retryWrites=true&w=majority';
  const DB_NAME = process.env.MONGO_DB || 'maxx-xmd';
  
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db(DB_NAME);
}

const activeSockets: Map<string, any> = new Map();

function createAuthDir(phone: string): string {
  const authDir = path.join(process.cwd(), 'auth', phone);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return authDir;
}

async function loadAuthState(phone: string) {
  const authDir = createAuthDir(phone);
  
  const credsFile = path.join(authDir, 'creds.json');
  const keysDir = path.join(authDir, 'keys');
  
  let creds: any = initAuthCreds();
  
  if (fs.existsSync(credsFile)) {
    try {
      const credsData = fs.readFileSync(credsFile, 'utf-8');
      creds = JSON.parse(credsData);
      console.log('[AUTH] Loaded existing credentials for', phone);
    } catch (e) {
      console.log('[AUTH] Failed to load creds, creating new');
    }
  }
  
  return {
    creds,
    keys: {}
  };
}

async function saveAuthState(phone: string, creds: any) {
  const authDir = createAuthDir(phone);
  const credsFile = path.join(authDir, 'creds.json');
  
  try {
    fs.writeFileSync(credsFile, JSON.stringify(creds, null, 2));
    console.log('[AUTH] Saved credentials for', phone);
  } catch (e) {
    console.error('[AUTH] Failed to save creds:', e);
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const logsCollection = db.collection('logs');
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    console.log('[PAIR] Starting pairing for:', fullPhone);

    if (activeSockets.has(cleanPhone)) {
      console.log('[PAIR] Closing existing socket');
      try {
        activeSockets.get(cleanPhone).end({ reason: 'New pairing request' });
      } catch {}
      activeSockets.delete(cleanPhone);
    }

    const authState = await loadAuthState(cleanPhone);

    const sock = makeWASocket({
      auth: authState as any,
      printQRInTerminal: true,
      browser: ['MAXX-XMD', 'Chrome', '120.0.0'],
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
    });

    activeSockets.set(cleanPhone, sock);

    sock.ev.on('creds.update', async (creds: any) => {
      await saveAuthState(cleanPhone, { ...authState.creds, ...creds });
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log('[PAIR] Connection:', connection);
      
      if (qr) {
        console.log('[PAIR] QR Code received (not using QR pairing)');
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as any)?.output?.statusCode;
        console.log('[PAIR] Connection closed, reason:', reason);
        
        await logsCollection.insertOne({
          phone: cleanPhone,
          event: 'connection_close',
          reason: reason,
          timestamp: new Date()
        });
      }

      if (connection === 'open') {
        console.log('[PAIR] Connected to WhatsApp!');
        
        await logsCollection.insertOne({
          phone: cleanPhone,
          event: 'connected',
          timestamp: new Date()
        });
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const msg of messages) {
          if (!msg.key.fromMe && msg.message) {
            console.log('[MSG] From:', msg.key.remoteJid);
            
            await logsCollection.insertOne({
              phone: cleanPhone,
              event: 'message',
              from: msg.key.remoteJid,
              message: msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'media',
              timestamp: new Date()
            });

            const chatId = msg.key.remoteJid as string;
            const response = "🤖 MAXX-XMD Bot Connected!\n\nI'm your AI assistant. How can I help you today?";
            
            await sock.sendMessage(chatId, { text: response });
          }
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 8000));

    if (!sock.authState?.creds) {
      throw new Error('Failed to initialize socket properly');
    }

    console.log('[PAIR] Requesting pairing code...');
    
    const code = await sock.requestPairingCode(fullPhone);
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;

    console.log('[PAIR] Success! Code:', formattedCode);

    await logsCollection.insertOne({
      phone: cleanPhone,
      event: 'pairing_code_generated',
      code: formattedCode,
      timestamp: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      pairingCode: formattedCode,
      phone: fullPhone,
      message: 'Enter this code on WhatsApp'
    });

  } catch (error: any) {
    console.error('[PAIR] Error:', error);
    
    const db = await getDb();
    const logsCollection = db.collection('logs');
    await logsCollection.insertOne({
      event: 'pairing_error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
    
    return NextResponse.json({ 
      error: error.message || 'Failed to generate pairing code' 
    }, { status: 500 });
  }
}

export async function GET() {
  const phones = Array.from(activeSockets.keys());
  return NextResponse.json({ active: phones });
}
