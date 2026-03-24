import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRequestPairing, useGetPairingStatus } from "@workspace/api-client-react";
import { CyberCard } from "@/components/ui/cyber-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LinkIcon, ShieldCheck, Copy, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  number: z
    .string()
    .min(10, "Must include country code, e.g., 2348123456789")
    .regex(/^\d+$/, "Numbers only — no + or spaces"),
});

export default function Pair() {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: "" },
  });

  const pairMut = useRequestPairing({
    mutation: {
      onSuccess: (data) => {
        setSessionId(data.sessionId ?? null);
        setPairingCode(data.pairingCode ?? null);
        setErrorMsg(null);
        toast({ title: "Code Generated", description: "Enter this code in WhatsApp." });
      },
      onError: (err: any) => {
        const msg =
          err?.data?.error ||
          err?.message ||
          "Failed to generate pairing code. Try again.";
        setErrorMsg(msg);
        toast({ variant: "destructive", title: "Error", description: msg });
      },
    },
  });

  const { data: status } = useGetPairingStatus(sessionId ?? "", {
    query: {
      enabled: !!sessionId,
      refetchInterval: (query) => {
        return query.state.data?.connected ? false : 3000;
      },
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setErrorMsg(null);
    pairMut.mutate({ data: values });
  }

  function reset() {
    setPairingCode(null);
    setSessionId(null);
    setErrorMsg(null);
    setCopied(false);
    setCopiedSession(false);
    form.reset();
  }

  function copyCode() {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode.replace(/-/g, ""));
      setCopied(true);
      toast({ title: "Code copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function copySessionId() {
    if (status?.deploySessionId) {
      navigator.clipboard.writeText(status.deploySessionId);
      setCopiedSession(true);
      toast({ title: "Session ID copied!" });
      setTimeout(() => setCopiedSession(false), 2000);
    }
  }

  const isConnected = !!status?.connected;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl text-primary font-mono glow-text">DEVICE_PAIRING</h1>
        <p className="text-muted-foreground font-mono mt-1">
          Link your WhatsApp &amp; receive session ID
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Input */}
        <CyberCard title="Input Parameters" delay={0.1}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-primary">YOUR_WHATSAPP_NUMBER</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="254700000000"
                          {...field}
                          className="pl-10 font-mono text-lg bg-black/50 border-primary/30 focus-visible:ring-primary"
                          disabled={pairMut.isPending || !!pairingCode}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground font-mono">
                      Country code + number, no + or spaces. E.g. <span className="text-primary">254700000000</span>
                    </p>
                    <FormMessage className="font-mono" />
                  </FormItem>
                )}
              />

              {errorMsg && (
                <div className="flex items-start gap-2 bg-red-950/30 border border-red-500/40 rounded p-3 text-sm font-mono text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!pairingCode ? (
                <Button
                  type="submit"
                  className="w-full cyber-button h-12 font-mono text-lg bg-primary text-primary-foreground"
                  disabled={pairMut.isPending}
                >
                  <LinkIcon className="w-5 h-5 mr-2" />
                  {pairMut.isPending ? "GENERATING CODE..." : "GET_PAIRING_CODE"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={reset}
                  className="w-full font-mono border-primary/30 text-primary hover:bg-primary/10"
                >
                  START_OVER
                </Button>
              )}
            </form>
          </Form>

          {/* Steps */}
          <div className="mt-6 space-y-2 text-xs font-mono text-muted-foreground border-t border-primary/10 pt-4">
            <p className="text-primary font-bold text-sm">HOW IT WORKS:</p>
            <p className={pairingCode ? "text-primary" : ""}>1. Enter your WhatsApp number above</p>
            <p className={pairingCode ? "text-primary" : ""}>2. Copy the 8-digit code shown</p>
            <p>3. Open WhatsApp → Menu → Linked Devices</p>
            <p>4. Tap "Link a Device" → "Link with phone number instead"</p>
            <p>5. Enter the code — session ID will be sent to your WhatsApp</p>
          </div>
        </CyberCard>

        {/* Right: Status / Code */}
        <CyberCard title="Pairing Status" delay={0.2} className="flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[320px]">
            <AnimatePresence mode="wait">
              {!pairingCode && !isConnected && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-muted-foreground font-mono opacity-50"
                >
                  <LinkIcon className="w-16 h-16 mx-auto mb-4" />
                  <p>Awaiting target vector...</p>
                </motion.div>
              )}

              {pairingCode && !isConnected && (
                <motion.div
                  key="code"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="text-center w-full space-y-5"
                >
                  <p className="font-mono text-sm text-primary animate-pulse">
                    AWAITING DEVICE CONFIRMATION...
                  </p>

                  <div className="bg-black/70 border-2 border-primary/60 rounded-xl p-6 relative group shadow-[0_0_20px_rgba(0,255,136,0.15)]">
                    <p className="text-xs font-mono text-muted-foreground mb-3 uppercase tracking-widest">
                      Enter in WhatsApp
                    </p>
                    <h2 className="text-4xl md:text-5xl font-mono font-bold tracking-[0.25em] text-white glow-text">
                      {pairingCode}
                    </h2>
                    <button
                      onClick={copyCode}
                      className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-mono text-sm"
                    >
                      {copied ? (
                        <><CheckCircle2 className="w-4 h-4" /> COPIED!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> COPY CODE</>
                      )}
                    </button>
                  </div>

                  <div className="text-left font-mono text-xs text-muted-foreground space-y-1 bg-secondary/30 p-4 rounded border border-primary/10">
                    <p className="text-yellow-400">⚠ Code expires in ~60 seconds. Enter it quickly!</p>
                    <p className="mt-2 text-primary">After linking, your session ID will be sent to your WhatsApp.</p>
                  </div>
                </motion.div>
              )}

              {isConnected && (
                <motion.div
                  key="connected"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-5 w-full"
                >
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto glow-border">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-mono font-bold text-primary">LINK_ESTABLISHED</h3>

                  {status?.deploySessionId ? (
                    <div className="space-y-3 w-full">
                      <p className="text-sm font-mono text-muted-foreground">
                        Your session ID is ready. Copy it to deploy your bot.
                      </p>
                      <div className="bg-black/70 border border-primary/40 rounded-lg p-3 text-left">
                        <p className="text-xs font-mono text-muted-foreground mb-1">SESSION_ID</p>
                        <p className="text-xs font-mono text-primary break-all leading-relaxed">
                          {status.deploySessionId.substring(0, 60)}...
                        </p>
                      </div>
                      <button
                        onClick={copySessionId}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded border-2 border-primary/50 text-primary hover:bg-primary/10 transition-colors font-mono text-sm font-bold"
                      >
                        {copiedSession ? (
                          <><CheckCircle2 className="w-5 h-5" /> SESSION ID COPIED!</>
                        ) : (
                          <><Copy className="w-5 h-5" /> COPY FULL SESSION ID</>
                        )}
                      </button>
                      <p className="text-xs font-mono text-muted-foreground text-center">
                        This ID was also sent to your WhatsApp via message.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-mono text-primary animate-pulse">
                        Sending session ID to your WhatsApp...
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        Check your WhatsApp for a message from the linked device.
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-primary/10 border border-primary/30 rounded text-xs font-mono text-primary text-left">
                    &gt; Device paired successfully.<br />
                    &gt; Session credentials saved.<br />
                    &gt; Ready for deployment.
                  </div>

                  <Button
                    variant="outline"
                    onClick={reset}
                    className="font-mono border-primary/30 text-primary hover:bg-primary/10"
                  >
                    PAIR_ANOTHER_DEVICE
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CyberCard>
      </div>
    </div>
  );
}
