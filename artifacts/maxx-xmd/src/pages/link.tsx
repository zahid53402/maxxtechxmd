import { useState, useEffect, useRef } from "react";
import { useRequestPairing, useGetPairingStatus } from "@workspace/api-client-react";
import {
  Smartphone,
  Copy,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Zap,
  Loader2,
} from "lucide-react";

const PLATFORMS = [
  { name: "Heroku",  url: "https://heroku.com" },
  { name: "Railway", url: "https://railway.app" },
  { name: "Koyeb",   url: "https://koyeb.com" },
  { name: "Render",  url: "https://render.com" },
  { name: "Replit",  url: "https://replit.com" },
  { name: "Cyclic",  url: "https://cyclic.sh" },
];

export default function LinkPage() {
  const [number, setNumber]         = useState("");
  const [error, setError]           = useState("");
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [code, setCode]             = useState<string | null>(null);
  const [countdown, setCountdown]   = useState(120);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSid, setCopiedSid]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── MUTATION ── */
  const pairMut = useRequestPairing({
    mutation: {
      onSuccess(data) {
        setCode(data.pairingCode ?? null);
        setSessionId(data.sessionId ?? null);
        setError("");
        setCountdown(120);
      },
      onError(err: any) {
        setError(
          err?.data?.error || err?.message || "Failed to generate code. Please try again."
        );
      },
    },
  });

  /* ── POLL STATUS ── */
  const { data: status } = useGetPairingStatus(sessionId ?? "", {
    query: {
      enabled: !!sessionId,
      refetchInterval: (q) => (q.state.data?.connected ? false : 2000),
    },
  });

  /* ── COUNTDOWN ── */
  useEffect(() => {
    if (!code || status?.connected) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [code, status?.connected, countdown]);

  /* ── HANDLERS ── */
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = number.replace(/[^0-9]/g, "");
    if (!/^\d{10,15}$/.test(cleaned)) {
      setError("Enter country code + number, no + or spaces. E.g. 254700000000");
      return;
    }
    setError("");
    pairMut.mutate({ data: { number: cleaned } });
  }

  function reset() {
    setNumber("");
    setCode(null);
    setSessionId(null);
    setError("");
    setCopiedCode(false);
    setCopiedSid(false);
    setCountdown(120);
    pairMut.reset();
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code.replace(/-/g, ""));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  }

  function copySid() {
    const sid = status?.deploySessionId;
    if (!sid) return;
    navigator.clipboard.writeText(sid);
    setCopiedSid(true);
    setTimeout(() => setCopiedSid(false), 2500);
  }

  const isConnected = !!status?.connected;
  const isLoading   = pairMut.isPending;

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#030d06",
        backgroundImage:
          "linear-gradient(rgba(0,255,136,.025) 1px,transparent 1px)," +
          "linear-gradient(90deg,rgba(0,255,136,.025) 1px,transparent 1px)",
        backgroundSize: "36px 36px",
        color: "#e2e8f0",
        fontFamily: "'Share Tech Mono', 'Courier New', monospace",
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          borderBottom: "1px solid rgba(0,255,136,.12)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "rgba(0,255,136,.12)",
              border: "1px solid rgba(0,255,136,.35)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={16} color="#00ff88" />
          </div>
          <span style={{ color: "#00ff88", fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>
            MAXX-XMD
          </span>
          <span
            style={{
              color: "rgba(0,255,136,.4)",
              fontSize: 11,
              borderLeft: "1px solid rgba(0,255,136,.15)",
              paddingLeft: 12,
              marginLeft: 4,
              letterSpacing: 2,
            }}
          >
            SESSION GENERATOR
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(0,255,136,.5)" }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#00ff88",
              animation: "pulse 2s infinite",
            }}
          />
          SYSTEM ONLINE
        </div>
      </header>

      {/* ── MAIN ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "40px 16px 60px",
          maxWidth: 540,
          margin: "0 auto",
          width: "100%",
        }}
      >

        {/* ─────────────────────────────────────────
            STEP A — INPUT FORM (code not yet shown)
        ───────────────────────────────────────── */}
        {!code && !isConnected && (
          <>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 20px",
                  background: "rgba(0,255,136,.1)",
                  border: "1px solid rgba(0,255,136,.3)",
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Smartphone size={32} color="#00ff88" />
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
                Get Your{" "}
                <span
                  style={{
                    color: "#00ff88",
                    textShadow: "0 0 18px rgba(0,255,136,.5)",
                  }}
                >
                  Session ID
                </span>
              </h1>
              <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
                Link your WhatsApp &amp; receive a session ID to deploy your bot anywhere.
              </p>
            </div>

            <form
              onSubmit={submit}
              style={{
                width: "100%",
                background: "rgba(0,20,8,.7)",
                border: "1px solid rgba(0,255,136,.18)",
                borderRadius: 16,
                padding: "28px 24px",
              }}
            >
              <label
                style={{
                  display: "block",
                  color: "#00ff88",
                  fontSize: 11,
                  letterSpacing: 3,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                WhatsApp Number
              </label>
              <div style={{ position: "relative" }}>
                <Smartphone
                  size={18}
                  color="rgba(0,255,136,.45)"
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  ref={inputRef}
                  type="tel"
                  placeholder="254700000000"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(0,0,0,.5)",
                    border: "1px solid rgba(0,255,136,.25)",
                    borderRadius: 10,
                    padding: "14px 14px 14px 44px",
                    fontSize: 18,
                    color: "#fff",
                    outline: "none",
                    letterSpacing: 2,
                  }}
                />
              </div>
              <p style={{ color: "#4b5563", fontSize: 12, marginTop: 6 }}>
                Country code + number, no + sign.&nbsp;
                <span style={{ color: "rgba(0,255,136,.6)" }}>E.g. 254700000000</span>
              </p>

              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    background: "rgba(127,0,0,.25)",
                    border: "1px solid rgba(255,50,50,.3)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginTop: 14,
                  }}
                >
                  <AlertCircle size={14} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: "#f87171", fontSize: 13 }}>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  marginTop: 18,
                  padding: "15px",
                  background: isLoading ? "rgba(0,255,136,.4)" : "#00ff88",
                  color: "#000",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: 1,
                  border: "none",
                  borderRadius: 10,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: isLoading ? "none" : "0 0 28px rgba(0,255,136,.35)",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Generate Pairing Code
                  </>
                )}
              </button>

              {/* Steps */}
              <div style={{ marginTop: 24, borderTop: "1px solid rgba(0,255,136,.08)", paddingTop: 18 }}>
                {[
                  "Enter your WhatsApp number above",
                  "Copy the 8-digit code shown",
                  "Open WhatsApp → Menu → Linked Devices → Link a Device → Link with phone number",
                  "Enter the code → session ID sent to your WhatsApp",
                  "Deploy on Heroku, Railway, Koyeb, Replit...",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <span
                      style={{
                        minWidth: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "1px solid rgba(0,255,136,.3)",
                        color: "#00ff88",
                        fontSize: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </form>
          </>
        )}

        {/* ─────────────────────────────────────────
            STEP B — CODE DISPLAY
        ───────────────────────────────────────── */}
        {code && !isConnected && (
          <div style={{ width: "100%" }}>
            <p style={{ textAlign: "center", color: "rgba(0,255,136,.55)", fontSize: 13, letterSpacing: 2, marginBottom: 4 }}>
              WAITING FOR YOU TO LINK IN WHATSAPP
            </p>
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: 12, marginBottom: 28 }}>
              Number: <span style={{ color: "#9ca3af" }}>{number.replace(/[^0-9]/g, "")}</span>
            </p>

            {/* BIG CODE BOX */}
            <div
              style={{
                background: "rgba(0,20,8,.85)",
                border: `2px solid ${countdown > 40 ? "#00ff88" : countdown > 20 ? "#fbbf24" : "#ef4444"}`,
                borderRadius: 18,
                padding: "32px 24px",
                textAlign: "center",
                marginBottom: 16,
                boxShadow: `0 0 40px ${countdown > 40 ? "rgba(0,255,136,.12)" : countdown > 20 ? "rgba(251,191,36,.12)" : "rgba(239,68,68,.12)"}`,
                position: "relative",
              }}
            >
              {/* Countdown badge */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: countdown > 40 ? "#00ff88" : countdown > 20 ? "#fbbf24" : "#ef4444",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: countdown > 40 ? "#00ff88" : countdown > 20 ? "#fbbf24" : "#ef4444",
                    animation: "pulse 1s infinite",
                  }}
                />
                {countdown}s
              </div>

              <p
                style={{
                  fontSize: 11,
                  color: "rgba(0,255,136,.5)",
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Your Pairing Code
              </p>

              {/* THE CODE — huge and unmissable */}
              <div
                style={{
                  fontSize: "clamp(42px, 10vw, 64px)",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  color: "#ffffff",
                  textShadow: "0 0 30px rgba(0,255,136,.7), 0 0 60px rgba(0,255,136,.25)",
                  lineHeight: 1.1,
                  marginBottom: 24,
                  wordBreak: "break-all",
                }}
              >
                {code}
              </div>

              <button
                onClick={copyCode}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 28px",
                  border: "1px solid rgba(0,255,136,.4)",
                  borderRadius: 10,
                  background: copiedCode ? "rgba(0,255,136,.15)" : "transparent",
                  color: "#00ff88",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: 1,
                }}
              >
                {copiedCode ? (
                  <><CheckCircle2 size={16} /> COPIED!</>
                ) : (
                  <><Copy size={16} /> COPY CODE</>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div
              style={{
                background: "rgba(0,20,8,.6)",
                border: "1px solid rgba(0,255,136,.1)",
                borderRadius: 12,
                padding: "18px 20px",
                marginBottom: 16,
              }}
            >
              <p style={{ color: "#00ff88", fontSize: 11, letterSpacing: 3, marginBottom: 10 }}>
                HOW TO ENTER IN WHATSAPP:
              </p>
              {[
                "Open WhatsApp on your phone",
                "Tap the 3-dot menu (⋮) → Linked Devices",
                'Tap "Link a Device"',
                '"Link with phone number instead"',
                "Type the code above exactly as shown",
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "#9ca3af" }}>
                  <span style={{ color: "#00ff88", flexShrink: 0 }}>{i + 1}.</span>
                  {t}
                </div>
              ))}
              <p style={{ color: "#fbbf24", fontSize: 12, marginTop: 10 }}>
                ⚠ Code expires in ~2 minutes — enter it quickly!
              </p>
            </div>

            <button
              onClick={reset}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 10,
                color: "#6b7280",
                fontFamily: "inherit",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Start Over
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP C — CONNECTED / SESSION ID
        ───────────────────────────────────────── */}
        {isConnected && (
          <div style={{ width: "100%", textAlign: "center" }}>
            {/* Success icon */}
            <div
              style={{
                width: 80,
                height: 80,
                margin: "0 auto 20px",
                background: "rgba(0,255,136,.12)",
                border: "2px solid rgba(0,255,136,.5)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 40px rgba(0,255,136,.25)",
              }}
            >
              <ShieldCheck size={40} color="#00ff88" />
            </div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#00ff88",
                textShadow: "0 0 18px rgba(0,255,136,.5)",
                margin: "0 0 6px",
              }}
            >
              WhatsApp Linked!
            </h2>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28 }}>
              Your session ID is ready. Deploy your bot anywhere below.
            </p>

            {/* Session ID box */}
            <div
              style={{
                background: "rgba(0,20,8,.8)",
                border: "2px solid rgba(0,255,136,.35)",
                borderRadius: 16,
                padding: "24px",
                marginBottom: 14,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "#00ff88", fontSize: 11, letterSpacing: 3 }}>SESSION ID</span>
                <span style={{ color: "#00ff88", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={12} /> Ready
                </span>
              </div>

              {status?.deploySessionId ? (
                <>
                  <div
                    style={{
                      background: "rgba(0,0,0,.5)",
                      borderRadius: 8,
                      padding: "12px 14px",
                      marginBottom: 14,
                    }}
                  >
                    <p
                      style={{
                        color: "rgba(0,255,136,.7)",
                        fontSize: 11,
                        wordBreak: "break-all",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {status.deploySessionId.substring(0, 90)}
                      <span style={{ color: "#374151" }}>
                        …({status.deploySessionId.length} chars total)
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={copySid}
                    style={{
                      width: "100%",
                      padding: "15px",
                      background: copiedSid ? "rgba(0,255,136,.2)" : "#00ff88",
                      color: copiedSid ? "#00ff88" : "#000",
                      fontFamily: "inherit",
                      fontWeight: 700,
                      fontSize: 15,
                      border: copiedSid ? "1px solid #00ff88" : "none",
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: copiedSid ? "none" : "0 0 28px rgba(0,255,136,.3)",
                    }}
                  >
                    {copiedSid ? (
                      <><CheckCircle2 size={18} /> SESSION ID COPIED!</>
                    ) : (
                      <><Copy size={18} /> Copy Full Session ID</>
                    )}
                  </button>
                  <p style={{ color: "#4b5563", fontSize: 12, textAlign: "center", marginTop: 10 }}>
                    This was also sent to your WhatsApp as a message.
                  </p>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <Loader2 size={22} color="#00ff88" style={{ animation: "spin 1s linear infinite", margin: "0 auto 10px", display: "block" }} />
                  <p style={{ color: "#6b7280", fontSize: 13 }}>
                    Encoding session... check your WhatsApp for the message.
                  </p>
                </div>
              )}
            </div>

            {/* Deploy platforms */}
            <div
              style={{
                background: "rgba(0,20,8,.6)",
                border: "1px solid rgba(0,255,136,.1)",
                borderRadius: 16,
                padding: "20px",
                marginBottom: 14,
                textAlign: "left",
              }}
            >
              <p style={{ color: "#00ff88", fontSize: 11, letterSpacing: 3, marginBottom: 14 }}>
                DEPLOY YOUR BOT
              </p>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
                Fork{" "}
                <a
                  href="https://github.com/Carlymaxx/maxxtechxmd"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#00ff88" }}
                >
                  github.com/Carlymaxx/maxxtechxmd
                </a>{" "}
                then set{" "}
                <code
                  style={{
                    background: "rgba(0,255,136,.08)",
                    border: "1px solid rgba(0,255,136,.2)",
                    borderRadius: 4,
                    padding: "1px 6px",
                    color: "#00ff88",
                    fontSize: 12,
                  }}
                >
                  SESSION_ID
                </code>{" "}
                env var to your copied session ID.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                {PLATFORMS.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "rgba(0,0,0,.35)",
                      border: "1px solid rgba(255,255,255,.07)",
                      borderRadius: 8,
                      color: "#9ca3af",
                      fontSize: 12,
                      textDecoration: "none",
                    }}
                  >
                    {p.name}
                    <ExternalLink size={11} color="#4b5563" />
                  </a>
                ))}
              </div>
            </div>

            <button
              onClick={reset}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 10,
                color: "#6b7280",
                fontFamily: "inherit",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Generate Another Session
            </button>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(0,255,136,.08)",
          padding: "14px 24px",
          textAlign: "center",
          fontSize: 12,
          color: "#374151",
        }}
      >
        Powered by <span style={{ color: "rgba(0,255,136,.4)" }}>MAXX-XMD</span> · Built by MAXX TECH
      </footer>

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
