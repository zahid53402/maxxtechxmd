import makeWASocket, { initAuthCreds } from '@whiskeysockets/baileys';
import { MongoClient } from 'mongodb';
import readline from 'readline';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://maxxbot:maxxbot2020@clustersessions.pcz8pqh.mongodb.net/maxx-xmd?retryWrites=true&w=majority';

const mongoClient = new MongoClient(MONGO_URI);

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  await mongoClient.connect();
  const db = mongoClient.db('maxx-xmd');
  const sessionsCollection = db.collection('sessions');

  console.log('\n========================================');
  console.log('  MAXX-XMD Local Pairing Tool');
  console.log('========================================\n');

  const phone = await askQuestion('Enter your WhatsApp number (with country code, no +): ');
  
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

  console.log(`\n[INFO] Pairing for: ${fullPhone}\n`);

  const creds = initAuthCreds();

  const sock = makeWASocket({
    auth: {
      creds,
      keys: {
        get: async () => ({}),
        set: async () => {}
      }
    },
    printQRInTerminal: true,
    browser: ['MAXX-XMD', 'Chrome', '120.0.0'],
  });

  let connected = false;

  sock.ev.on('connection.update', (update) => {
    const { connection } = update;
    console.log('[CONN] Status:', connection);
    
    if (connection === 'open') {
      connected = true;
      console.log('[✅] Connected to WhatsApp!');
    }
  });

  sock.ev.on('creds.update', (newCreds) => {
    Object.assign(creds, newCreds);
  });

  console.log('[INFO] Waiting for connection...\n');

  // Wait for connection
  let attempts = 0;
  while (!connected && attempts < 30) {
    await new Promise(r => setTimeout(r, 1000));
    attempts++;
    console.log(`[INFO] Waiting... ${attempts}/30`);
  }

  if (!connected) {
    console.log('\n[❌] Failed to connect!\n');
    process.exit(1);
  }

  console.log('\n[📱] Requesting pairing code...\n');

  const code = await sock.requestPairingCode(fullPhone);
  const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;

  console.log('========================================');
  console.log(`  PAIRING CODE: ${formattedCode}`);
  console.log('========================================');
  console.log('\n[📋] Enter this code in WhatsApp:');
  console.log('    Settings → Linked Devices → Link a Device');
  console.log('\n[⏳] Waiting for device to connect...\n');

  // Wait for user to pair
  await new Promise(r => setTimeout(r, 30000));

  // Save session
  const sessionId = Math.random().toString(36).substring(2, 18);
  
  await sessionsCollection.updateOne(
    { phone: cleanPhone },
    {
      $set: {
        phone: cleanPhone,
        fullPhone,
        creds,
        sessionId,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  console.log('\n========================================');
  console.log('  ✅ SUCCESS!');
  console.log('========================================');
  console.log(`\n[🔑] Session ID: ${sessionId}`);
  console.log('\n[💾] Session saved to MongoDB!');
  console.log('\n[🤖] Now run your bot with:');
  console.log(`    SESSION_ID=${sessionId} bun run bot\n`);

  sock.end(undefined);
  await mongoClient.close();
}

main().catch(console.error);
