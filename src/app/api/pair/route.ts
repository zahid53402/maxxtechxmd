import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

let cachedQR: string | null = null;
let qrExpiration: number = 0;

export async function GET() {
  try {
    const now = Date.now();
    
    if (cachedQR && now < qrExpiration) {
      return NextResponse.json({ qr: cachedQR });
    }

    const qrData = `WhatsApp Pairing-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    cachedQR = qrImage;
    qrExpiration = now + 60000;

    return NextResponse.json({ qr: qrImage });
  } catch (error) {
    console.error('QR Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
  }
}
