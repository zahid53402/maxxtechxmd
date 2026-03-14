"use client";

import { useState } from "react";

type Step = "input" | "generating" | "pairing" | "success" | "error";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;

    setStep("generating");
    setMessage("Generating pairing code...");
    setError("");

    try {
      const res = await fetch('/api/pair/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await res.json();
      console.log('Response:', data);

      if (data.success && data.pairingCode) {
        setPairingCode(data.pairingCode);
        setPhoneNumber(data.phone);
        setStep("pairing");
        setMessage("Enter this code on your WhatsApp");
      } else {
        setStep("error");
        setError(data.error || "Failed to generate pairing code");
      }
    } catch (err) {
      console.error('Error:', err);
      setStep("error");
      setError("Failed to connect to server");
    }
  };

  const reset = () => {
    setStep("input");
    setPhone("");
    setMessage("");
    setError("");
    setPairingCode("");
    setPhoneNumber("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">MAXX-XMD</h1>
          <p className="text-white/80">Link your WhatsApp to get your own bot</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`flex items-center gap-2 ${step === 'input' ? 'text-white' : 'text-white/50'}`}>
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">1</span>
              <span>Enter Number</span>
            </div>
            <div className="h-px w-8 bg-white/30"></div>
            <div className={`flex items-center gap-2 ${step === 'pairing' ? 'text-white' : 'text-white/50'}`}>
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">2</span>
              <span>Link Device</span>
            </div>
            <div className="h-px w-8 bg-white/30"></div>
            <div className={`flex items-center gap-2 ${step === 'success' ? 'text-white' : 'text-white/50'}`}>
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">3</span>
              <span>Complete</span>
            </div>
          </div>

          {step === "input" && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="text-white/80 text-sm mb-2 block">Your WhatsApp Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="254725979273"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/50 text-center text-lg"
                  required
                />
                <p className="text-white/60 text-xs mt-2 text-center">Country code + number, no + or spaces</p>
              </div>

              <button 
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition font-medium"
              >
                Get Pairing Code
              </button>
            </form>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-white text-lg">{message}</p>
            </div>
          )}

          {step === "pairing" && (
            <div className="text-center">
              <p className="text-white/80 mb-4">Enter this code on WhatsApp</p>
              
              <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
                <p className="text-white/60 text-sm mb-2">{phoneNumber}</p>
                <p className="text-4xl font-mono font-bold text-white tracking-widest">
                  {pairingCode}
                </p>
              </div>

              <button 
                onClick={reset}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm"
              >
                Cancel
              </button>

              <p className="text-white/60 text-xs mt-4">
                WhatsApp → Settings → Linked Devices → Link a Device
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <p className="text-white text-xl font-bold mb-2">Connected!</p>
              <p className="text-white/80 mb-4">{message}</p>
              <button 
                onClick={reset}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                Connect Another
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✕</span>
              </div>
              <p className="text-white text-xl font-bold mb-2">Failed</p>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <button 
                onClick={reset}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-white/60 text-sm">
          Powered by MAXX-XMD • GitHub
        </div>
      </div>
    </main>
  );
}
