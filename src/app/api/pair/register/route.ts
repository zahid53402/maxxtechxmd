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

    console.log('[PAIR] Generating for:', fullPhone);

    const existingSession = await sessionsCollection.findOne({ phone: cleanPhone, active: true });
    let sessionId = existingSession?.sessionId;

    if (!sessionId) {
      sessionId = generateSessionId();
    }

    const creds = existingSession?.creds || initAuthCreds();

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

    await new Promise(resolve => setTimeout(resolve, 5000));

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

    console.log('[PAIR] Session:', sessionId, 'Code:', formattedCode);

    return NextResponse.json({
      success: true,
      pairingCode: formattedCode,
      phone: fullPhone,
      sessionId,
      instructions: 'Use this Session ID to deploy your bot on any platform'
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
  return NextResponse.json({ 
    status: 'ok',
    usage: 'POST with { phone: "+1234567890" } to get pairing code and session ID'
  });
}
