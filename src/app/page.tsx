"use client";

import { useState } from "react";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [step, setStep] = useState<"input" | "code">("input");
  const [copied, setCopied] = useState(false);

  const generateCode = (phoneNumber: string) => {
    const clean = phoneNumber.replace(/\D/g, "");
    const timestamp = Date.now().toString().slice(-6);
    const code = (parseInt(clean.slice(-4)) + parseInt(timestamp.slice(-4))).toString().padStart(6, "0").slice(-6);
    return code;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;

    const code = generateCode(phone);
    setPairingCode(code);
    setStep("code");

    fetch('/api/pair/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    }).catch(() => {});
  };

  const handleNewPairing = () => {
    setStep("input");
    setPairingCode("");
    setPhone("");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">MaxX Tech</h1>
          <p className="text-gray-400">WhatsApp Bot Pairing</p>
        </div>

        {step === "input" ? (
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="w-full mb-6">
              <label className="text-gray-400 text-sm mb-2 block">Enter your WhatsApp number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:border-purple-500 text-center"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-medium"
            >
              Generate Pairing Code
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center">
            <div className="bg-gray-900/50 p-6 rounded-2xl w-full mb-6">
              <p className="text-gray-400 text-sm mb-2 text-center">Your Pairing Code</p>
              <div className="flex items-center justify-center">
                <span className="text-5xl font-mono font-bold text-white tracking-widest">
                  {pairingCode}
                </span>
              </div>
            </div>

            <p className="text-gray-400 text-center text-sm mb-2">
              Open WhatsApp → Settings → Linked Devices
            </p>
            <p className="text-gray-400 text-center text-sm mb-6">
              Link Device → Enter this code: <strong>{pairingCode}</strong>
            </p>

            <div className="flex gap-3 w-full">
              <button 
                onClick={handleNewPairing}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition font-medium"
              >
                New Number
              </button>
              <button 
                onClick={copyCode}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-medium"
              >
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 text-gray-500 text-sm">
        Powered by MaxX Tech
      </footer>
    </main>
  );
}
