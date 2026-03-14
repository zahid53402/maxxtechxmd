import { NextResponse } from 'next/server';
import makeWASocket, { initAuthCreds } from '@whiskeysockets/baileys';
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

function createAuthDir(phone: string): string {
  const authDir = path.join(process.cwd(), 'auth', phone);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return authDir;
}

function loadOrCreateCreds(phone: string) {
  const authDir = createAuthDir(phone);
  const credsFile = path.join(authDir, 'creds.json');
  
  let creds = initAuthCreds();
  
  if (fs.existsSync(credsFile)) {
    try {
      const data = fs.readFileSync(credsFile, 'utf-8');
      creds = { ...creds, ...JSON.parse(data) };
    } catch (e) {
      console.log('[CREDS] Failed to load, using new');
    }
  }
  
  return creds;
}

function saveCreds(phone: string, creds: any) {
  const authDir = createAuthDir(phone);
  const credsFile = path.join(authDir, 'creds.json');
  fs.writeFileSync(credsFile, JSON.stringify(creds, null, 2));
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

    console.log('[PAIR] Generating code for:', fullPhone);

    await logsCollection.insertOne({
      phone: cleanPhone,
      event: 'pairing_started',
      timestamp: new Date()
    });

    const creds = loadOrCreateCreds(cleanPhone);

    const sock = makeWASocket({
      auth: { 
        creds, 
        keys: {
          get: async () => ({}),
          set: async () => {}
        }
      },
      printQRInTerminal: false,
      browser: ['MAXX-XMD', 'Chrome', '120.0.0'],
    });

    sock.ev.on('creds.update', (newCreds) => {
      const updated = { ...creds, ...newCreds };
      saveCreds(cleanPhone, updated);
    });

    sock.ev.on('connection.update', (update) => {
      const { connection } = update;
      console.log('[PAIR] Connection:', connection);
      
      if (connection === 'close') {
        console.log('[PAIR] Connection closed (expected in serverless)');
      }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    if (!sock.authState?.creds) {
      throw new Error('Failed to initialize');
    }

    const code = await (sock as any).requestPairingCode(fullPhone);
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;

    console.log('[PAIR] Code:', formattedCode);

    await logsCollection.insertOne({
      phone: cleanPhone,
      event: 'pairing_code_generated',
      code: formattedCode,
      timestamp: new Date()
    });

    try {
      sock.end(undefined);
    } catch {}

    return NextResponse.json({ 
      success: true, 
      pairingCode: formattedCode,
      phone: fullPhone
    });

  } catch (error: any) {
    console.error('[PAIR] Error:', error);
    
    try {
      const db = await getDb();
      const logsCollection = db.collection('logs');
      await logsCollection.insertOne({
        event: 'pairing_error',
        error: error.message,
        timestamp: new Date()
      });
    } catch {}
    
    return NextResponse.json({ 
      error: error.message || 'Failed to generate pairing code' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
