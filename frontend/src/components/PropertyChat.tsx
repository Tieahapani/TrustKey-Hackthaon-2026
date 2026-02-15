/**
 * PropertyChat — AI-powered property assistant using Tambo AI.
 * Rendered inline within a listing detail sidebar.
 *
 * @module PropertyChat
 */

import { useState, useRef, useEffect, type FormEvent } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Props accepted by `<PropertyChat />`. */
interface PropertyChatProps {
  /** The listing this chat session is scoped to. */
  listingId: string;
  /** Optional title for context */
  listingTitle?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Inline card-style chat widget that lets buyers ask AI-powered questions
 * about a specific property listing using Tambo AI.
 *
 * @param props - Component props.
 * @param props.listingId - ID of the listing to scope questions to.
 * @param props.listingTitle - Optional title for additional context.
 */
export default function PropertyChat({ listingId, listingTitle }: PropertyChatProps) {
  /* ---- state ---- */
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string>();

  /* ---- refs ---- */
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ---- Tambo hooks ---- */
  const { messages, isStreaming } = useTambo();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  /* ---- auto-scroll on new messages ---- */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  /* ---- handlers ---- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;

    const result = await submit();
    if (!threadId && result?.threadId) {
      setThreadId(result.threadId);
    }
  };

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
              {/* Initial greeting if no messages */}
              {messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm text-foreground">
                    Hi! I'm your AI property assistant. Ask me anything about this listing — amenities, neighborhood, pricing, and more.
                  </div>
                </div>
              )}

              {/* Render messages from Tambo */}
              {messages.map((m, i) => {
                // Extract text content from Tambo's Content type
                const textContent = Array.isArray(m.content)
                  ? m.content.map((c) => {
                      if (typeof c === 'string') return c;
                      if ('text' in c) return c.text;
                      return '';
                    }).join('')
                  : typeof m.content === 'string'
                  ? m.content
                  : '';

                return (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        m.role === "user"
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-muted text-foreground"
                      }`}
                    >
                      {textContent}
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator */}
              {(isPending || isStreaming) && (
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
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Ask about this property..."
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isPending || !value.trim()}
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
