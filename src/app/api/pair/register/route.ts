import { NextResponse } from 'next/server';
import makeWASocket, { AuthenticationState, initAuthCreds } from '@whiskeysockets/baileys';
import { MongoClient } from 'mongodb';

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

const pendingPairing: Map<string, { socket: any; timeout: NodeJS.Timeout; phone: string }> = new Map();
const connectedDevices: Map<string, { phone: string; connected: boolean }> = new Map();

function createAuthState(creds?: any): { state: AuthenticationState; saveCreds: () => Promise<void> } {
  const credsObj = creds || initAuthCreds();
  
  return {
    state: {
      creds: credsObj,
      keys: {
        get: async () => ({}),
        set: async () => {},
      }
    },
    saveCreds: async () => {}
  };
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const sessionsCollection = db.collection('sessions');
    
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    console.log('Generating pairing code for:', fullPhone);

    if (pendingPairing.has(cleanPhone)) {
      const existing = pendingPairing.get(cleanPhone);
      if (existing) {
        try {
          existing.socket.end(undefined);
        } catch {}
        clearTimeout(existing.timeout);
      }
      pendingPairing.delete(cleanPhone);
    }

    const existingSession = await sessionsCollection.findOne({ phone: cleanPhone });
    
    let authState: { state: AuthenticationState; saveCreds: () => Promise<void> };
    if (existingSession && existingSession.creds) {
      console.log('Using existing credentials');
      authState = createAuthState(existingSession.creds);
    } else {
      console.log('Creating new credentials');
      authState = createAuthState();
    }

    const sock = makeWASocket({
      auth: authState.state,
      printQRInTerminal: false,
      browser: ['MAXX-XMD', 'Chrome', '120.0.0'],
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
    });

    const pairingInfo: { socket: any; timeout: NodeJS.Timeout; phone: string } = {
      socket: sock,
      phone: cleanPhone,
      timeout: setTimeout(() => {
        try {
          sock.end(undefined);
        } catch {}
        pendingPairing.delete(cleanPhone);
        console.log('Pairing timed out for:', cleanPhone);
      }, 120000)
    };
    pendingPairing.set(cleanPhone, pairingInfo);

    sock.ev.on('creds.update', async (creds: any) => {
      try {
        await sessionsCollection.updateOne(
          { phone: cleanPhone },
          { $set: { phone: cleanPhone, creds, updatedAt: new Date() } },
          { upsert: true }
        );
      } catch (err) {
        console.error('Failed to save creds:', err);
      }
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log('Connection update:', connection, qr ? 'QR received' : '');
      
      if (qr) {
        console.log('QR Code received');
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error || 'Unknown';
        console.log('Connection closed:', reason);
        clearTimeout(pairingInfo.timeout);
        pendingPairing.delete(cleanPhone);
      }

      if (connection === 'open') {
        console.log('Connected to WhatsApp!');
        clearTimeout(pairingInfo.timeout);
        pendingPairing.delete(cleanPhone);
        connectedDevices.set(cleanPhone, { phone: fullPhone, connected: true });
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const msg of messages) {
          if (!msg.key.fromMe && msg.message) {
            console.log('Received message from:', msg.key.remoteJid);
          }
        }
      }
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 5000);
    });

    if (!sock.authState?.creds) {
      throw new Error('Socket not properly initialized');
    }

    const code = await (sock as any).requestPairingCode(fullPhone);
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;

    console.log('Pairing code generated:', formattedCode);

    return NextResponse.json({ 
      success: true, 
      pairingCode: formattedCode,
      phone: fullPhone,
      message: `Enter this code on your WhatsApp`
    });

  } catch (error: any) {
    console.error('Pairing error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate pairing code' 
    }, { status: 500 });
  }
}

export async function GET() {
  const pending = Array.from(pendingPairing.keys());
  const connected = Array.from(connectedDevices.entries()).map(([phone, data]) => ({
    phone,
    connected: data.connected
  }));
  return NextResponse.json({ pending, connected });
}
