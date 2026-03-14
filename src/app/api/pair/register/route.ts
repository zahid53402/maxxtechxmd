import { NextResponse } from 'next/server';
import makeWASocket, { initAuthCreds } from '@whiskeysockets/baileys';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';

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

function generateSessionId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export async function POST(request: Request) {
  let sock: any = null;
  
  try {
    const db = await getDb();
    const sessionsCollection = db.collection('sessions');
    
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    console.log('[PAIR] Starting for:', fullPhone);

    const existingSession = await sessionsCollection.findOne({ phone: cleanPhone, active: true });
    let sessionId = existingSession?.sessionId;

    if (!sessionId) {
      sessionId = generateSessionId();
    }

    const creds = existingSession?.creds || initAuthCreds();
    let connected = false;
    let connectionError = '';

    sock = makeWASocket({
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

    sock.ev.on('creds.update', async (newCreds: any) => {
      const updated = { ...creds, ...newCreds };
      await sessionsCollection.updateOne(
        { sessionId },
        { $set: { creds: updated, updatedAt: new Date() } }
      );
    });

    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect } = update;
      console.log('[PAIR] Connection update:', connection);
      
      if (connection === 'open') {
        connected = true;
      }
      
      if (connection === 'close') {
        connectionError = lastDisconnect?.error?.message || 'Connection closed';
      }
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 10000));

    if (!connected) {
      console.log('[PAIR] Connection failed:', connectionError);
      return NextResponse.json({
        error: `Failed to connect to WhatsApp: ${connectionError || 'Timeout'}. Your hosting may have network restrictions.`
      }, { status: 500 });
    }

    console.log('[PAIR] Connected, getting code...');

    const code = await sock.requestPairingCode(fullPhone);
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;

    await sessionsCollection.updateOne(
      { sessionId },
      {
        $set: {
          phone: cleanPhone,
          fullPhone,
          creds,
          sessionId,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        $setOnInsert: { _id: new ObjectId() }
      },
      { upsert: true }
    );

    console.log('[PAIR] Done! Session:', sessionId);

    return NextResponse.json({
      success: true,
      pairingCode: formattedCode,
      phone: fullPhone,
      sessionId
    });

  } catch (error: any) {
    console.error('[PAIR] Error:', error.message);
    
    return NextResponse.json({
      error: error.message || 'Failed to generate pairing code'
    }, { status: 500 });
  } finally {
    if (sock) {
      try { sock.end(undefined); } catch {}
    }
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
