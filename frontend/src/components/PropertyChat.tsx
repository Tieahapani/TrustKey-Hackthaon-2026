/**
 * PropertyChat — AI-powered property assistant rendered inline within a
 * listing detail sidebar.  Communicates with the backend via
 * `chatWithAI` (RAG answer) and `textToSpeech` (audio playback).
 *
 * @module PropertyChat
 */

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { MessageCircle, X, Send, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { chatWithAI, textToSpeech } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** A single message in the conversation thread. */
interface Message {
  role: "user" | "assistant";
  text: string;
}

/** Props accepted by `<PropertyChat />`. */
interface PropertyChatProps {
  /** The listing this chat session is scoped to. */
  listingId: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Greeting shown when the chat first opens. */
const INITIAL_MESSAGE: Message = {
  role: "assistant",
  text: "Hi! I'm your AI property assistant. Ask me anything about this listing \u2014 amenities, neighborhood, pricing, and more.",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Inline card-style chat widget that lets buyers ask AI-powered questions
 * about a specific property listing.
 *
 * Designed to sit inside a sidebar on the listing detail page rather than
 * floating in a fixed position.
 *
 * @param props - Component props.
 * @param props.listingId - ID of the listing to scope questions to.
 */
export default function PropertyChat({ listingId }: PropertyChatProps) {
  /* ---- state ---- */
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  /* ---- refs ---- */
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ---- auto-scroll on new messages ---- */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* ---- reset conversation when listing changes ---- */
  useEffect(() => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setLoading(false);
    setSpeakingIdx(null);
  }, [listingId]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  /**
   * Send the current input to the backend AI chat endpoint and append
   * the response to the conversation.
   */
  const send = useCallback(async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const { answer } = await chatWithAI(listingId, question);
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I wasn\u2019t able to get an answer right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, listingId]);

  /**
   * Convert an assistant message to speech via the backend TTS endpoint
   * and play the resulting audio.
   *
   * @param text - The message text to speak.
   * @param idx  - Index of the message (used to track the active speaker icon).
   */
  const speak = useCallback(
    async (text: string, idx: number) => {
      if (speakingIdx !== null) return; // already playing
      setSpeakingIdx(idx);

      try {
        const blob = await textToSpeech(text);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setSpeakingIdx(null);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setSpeakingIdx(null);
        };

        await audio.play();
      } catch {
        // TTS failed — fall back to browser speech synthesis
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => setSpeakingIdx(null);
          utterance.onerror = () => setSpeakingIdx(null);
          window.speechSynthesis.speak(utterance);
        } else {
          setSpeakingIdx(null);
        }
      }
    },
    [speakingIdx],
  );

  /** Form submit handler that prevents default and delegates to `send`. */
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      send();
    },
    [send],
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="w-full">
      {/* Toggle button — visible when panel is collapsed */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-primary px-4 py-3 text-primary-foreground shadow-md transition-transform hover:scale-[1.02]"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">Ask AI About This Property</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
            style={{ height: "420px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">
                  AI Property Assistant
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-primary-foreground/70 hover:text-primary-foreground"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto p-4"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.role === "user"
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md bg-muted text-foreground"
                    }`}
                  >
                    {m.text}
                    {m.role === "assistant" && (
                      <button
                        onClick={() => speak(m.text, i)}
                        disabled={speakingIdx !== null}
                        className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground disabled:opacity-40"
                        title="Listen"
                        aria-label="Read message aloud"
                      >
                        <Volume2
                          className={`h-3.5 w-3.5 ${speakingIdx === i ? "animate-pulse" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this property..."
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
