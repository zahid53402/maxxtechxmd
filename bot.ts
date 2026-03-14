import makeWASocket, { DisconnectReason, initAuthCreds } from '@whiskeysockets/baileys';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://maxxbot:maxxbot2020@clustersessions.pcz8pqh.mongodb.net/maxx-xmd?retryWrites=true&w=majority';

const SESSION_ID = process.env.SESSION_ID;

if (!SESSION_ID) {
  console.error('[BOT] Please set SESSION_ID environment variable');
  console.log('[BOT] Usage: SESSION_ID=your-session-id bun run bot');
  process.exit(1);
}

const mongoClient = new MongoClient(MONGO_URI);
let db: any;

async function connectDb() {
  await mongoClient.connect();
  db = mongoClient.db('maxx-xmd');
  console.log('[DB] Connected to MongoDB');
}

async function startBot() {
  await connectDb();
  const sessionsCollection = db.collection('sessions');

  console.log(`[BOT] Looking for session: ${SESSION_ID}`);
  
  const session = await sessionsCollection.findOne({ sessionId: SESSION_ID });
  
  if (!session) {
    console.error('[BOT] Session not found in MongoDB!');
    console.log('[BOT] Please generate a session first on the web.');
    console.log('[BOT] Make sure SESSION_ID is correct and matches.');
    process.exit(1);
  }

  console.log(`[BOT] Session found for phone: ${session.phone}`);
  console.log(`[BOT] Has creds: ${!!session.creds}`);

  if (!session.creds) {
    console.error('[BOT] No credentials found! Please pair your device first.');
    console.log('[BOT] Go to the web app, enter your number and get a new pairing code.');
    process.exit(1);
  }

  console.log(`[BOT] Creds keys: ${Object.keys(session.creds).join(', ')}`);
  
  const creds = session.creds;
  const logsCollection = db.collection('logs');

  console.log('[BOT] Creating socket...');

  const sock = makeWASocket({
    auth: {
      creds,
      keys: {
        get: async () => ({}),
        set: async () => {}
      }
    },
    printQRInTerminal: true,
    browser: ['MAXX-XMD Bot', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60000,
  });

  sock.ev.on('creds.update', async (newCreds) => {
    const updated = { ...creds, ...newCreds };
    await sessionsCollection.updateOne(
      { sessionId: SESSION_ID },
      { $set: { creds: updated, updatedAt: new Date() } }
    );
    console.log('[BOT] Credentials updated in MongoDB');
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('[BOT] QR Code received (will not use - using creds)');
    }
    
    if (connection === 'open') {
      console.log('[BOT] ✅ Connected to WhatsApp!');
      await logsCollection.insertOne({
        sessionId: SESSION_ID,
        phone: session.phone,
        event: 'bot_connected',
        timestamp: new Date()
      });
    }

    if (connection === 'close') {
      const reason = (lastDisconnect?.error as any)?.output?.statusCode;
      console.log(`[BOT] Connection closed: ${reason}`);
      
      await logsCollection.insertOne({
        sessionId: SESSION_ID,
        phone: session.phone,
        event: 'bot_disconnected',
        reason,
        timestamp: new Date()
      });

      if (reason !== DisconnectReason.loggedOut) {
        console.log('[BOT] Reconnecting in 5 seconds...');
        setTimeout(() => startBot(), 5000);
      } else {
        console.log('[BOT] Logged out! Need to re-pair device.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const from = msg.key.remoteJid as string;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      
      console.log(`[MSG] From ${from}: ${text}`);

      await logsCollection.insertOne({
        sessionId: SESSION_ID,
        phone: session.phone,
        event: 'message_received',
        from,
        text,
        timestamp: new Date()
      });

      const response = generateResponse(text);
      
      await sock.sendMessage(from, { text: response });

      await logsCollection.insertOne({
        sessionId: SESSION_ID,
        phone: session.phone,
        event: 'message_sent',
        to: from,
        text: response,
        timestamp: new Date()
      });
    }
  });
}

function generateResponse(message: string): string {
  const lower = message.toLowerCase();

  const responses: Record<string, string> = {
    'hello': "Hello! 👋 I'm MAXX-XMD Bot. How can I help you today?",
    'hi': "Hello! 👋 I'm MAXX-XMD Bot. How can I help you today?",
    'hey': "Hello! 👋 I'm MAXX-XMD Bot. How can I help you today?",
    'help': "I'm here to help! Just send me a message and I'll respond.",
    'who are you': "I'm MAXX-XMD Bot, an AI-powered WhatsApp bot. I can chat with you!",
    'time': `The current time is ${new Date().toLocaleTimeString()}`,
    'date': `Today's date is ${new Date().toLocaleDateString()}`,
    'menu': "Available commands:\n- hello/hi/hey - Greet me\n- help - Get help\n- who are you - About me\n- time - Get current time\n- date - Get current date",
  };

  for (const [key, value] of Object.entries(responses)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  return `Thanks for your message: "${message}"!\n\nI'm MAXX-XMD Bot. Type "menu" for available commands. 😊`;
}

console.log('========================================');
console.log('[BOT] Starting MAXX-XMD Bot');
console.log(`[BOT] Session ID: ${SESSION_ID}`);
console.log('========================================');

startBot().catch(console.error);
