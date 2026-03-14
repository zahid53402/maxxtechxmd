import { NextResponse } from 'next/server';

interface PairingRequest {
  phone: string;
  code: string;
  createdAt: number;
}

const pendingPairings: Map<string, PairingRequest> = new Map();

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();
    
    const pairing: PairingRequest = {
      phone,
      code,
      createdAt: Date.now()
    };

    pendingPairings.set(phone, pairing);
    pendingPairings.set(code, pairing);

    setTimeout(() => {
      pendingPairings.delete(phone);
      pendingPairings.delete(code);
    }, 300000);

    return NextResponse.json({ success: true, message: "Pairing code generated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to register pairing" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const code = searchParams.get('code');

  if (phone && pendingPairings.has(phone)) {
    const pairing = pendingPairings.get(phone)!;
    return NextResponse.json({ 
      phone: pairing.phone, 
      code: pairing.code, 
      createdAt: pairing.createdAt 
    });
  }

  if (code && pendingPairings.has(code)) {
    const pairing = pendingPairings.get(code)!;
    return NextResponse.json({ 
      phone: pairing.phone, 
      code: pairing.code, 
      createdAt: pairing.createdAt 
    });
  }

  return NextResponse.json({ error: "No pending pairing found" }, { status: 404 });
}
