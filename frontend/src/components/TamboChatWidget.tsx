/**
 * TamboChatWidget - Floating chatbot widget using Tambo AI
 * Appears in the bottom-right corner like on Tambo's website.
 * Renders assistant responses with proper markdown formatting.
 */

import { useState, useRef, useEffect, type FormEvent } from "react";
import { MessageCircle, X, Send, Loader2, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTambo, useTamboThreadInput, useTamboContextAttachment } from "@tambo-ai/react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { fetchListings, type Listing } from "@/lib/api";

export default function TamboChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [threadId, setThreadId] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { messages, isStreaming } = useTambo();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { addContextAttachment, clearContextAttachments } = useTamboContextAttachment();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch all listings for general context
  const [allListings, setAllListings] = useState<Listing[]>([]);
  useEffect(() => {
    fetchListings()
      .then(setAllListings)
      .catch(() => {});
  }, []);

  // Add context based on what page the user is on
  useEffect(() => {
    if (!isOpen) return;

    clearContextAttachments();

    const isListingPage = location.pathname.startsWith('/listing/');

    if (isListingPage) {
      // Specific listing context
      const propertyData = (window as any).__CURRENT_LISTING__;
      if (propertyData) {
        addContextAttachment({
          context: `You are a helpful, friendly real estate AI assistant for **TrustKey** — a platform that helps renters and home buyers get pre-screened with AI-powered credit checks so sellers can trust them faster.

The user is currently viewing this specific property listing:

**Title:** ${propertyData.title}
**Address:** ${propertyData.address}, ${propertyData.city}, ${propertyData.state}
**Price:** $${propertyData.price.toLocaleString()}${propertyData.listingType === 'rent' ? '/month' : ''}
**Type:** ${propertyData.listingType === 'rent' ? 'For Rent' : 'For Sale'}
**Bedrooms:** ${propertyData.bedrooms}
**Bathrooms:** ${propertyData.bathrooms}
**Square Feet:** ${propertyData.sqft}
**Amenities:** ${propertyData.amenities?.join(', ') || 'None listed'}
**Description:** ${propertyData.description}
**Property Details:** ${propertyData.propertyDetails || propertyData.description}

**Screening Requirements to Apply:**
- Minimum Credit Score: ${propertyData.screeningCriteria?.minCreditScore || 'Not specified'}
- No Evictions Required: ${propertyData.screeningCriteria?.noEvictions ? 'Yes' : 'No'}
- No Bankruptcy Required: ${propertyData.screeningCriteria?.noBankruptcy ? 'Yes' : 'No'}
- No Criminal Record Required: ${propertyData.screeningCriteria?.noCriminal ? 'Yes' : 'No'}

Answer questions about this property using the above data. Be specific with numbers, details, and facts. Use markdown formatting with **bold**, bullet points, and clear structure. If the user asks about applying, explain TrustKey's screening process.`,
          displayName: `Property: ${propertyData.title}`,
        });
      }
    } else {
      // General platform context with all listings
      const listingSummaries = allListings.map((l) =>
        `- **${l.title}** at ${l.address}, ${l.city}, ${l.state} — $${l.price.toLocaleString()}${l.listingType === 'rent' ? '/mo' : ''} (${l.listingType === 'rent' ? 'Rent' : 'Sale'}) | ${l.bedrooms} bed, ${l.bathrooms} bath, ${l.sqft} sqft`
      ).join('\n');

      addContextAttachment({
        context: `You are a helpful, friendly, and knowledgeable real estate AI assistant for **TrustKey** — a modern real estate platform.

## About TrustKey
TrustKey helps renters and home buyers get **AI-powered pre-screening** (credit checks, background checks) so sellers and landlords can trust applicants faster. The platform features:
- **For Buyers/Renters:** Browse listings, apply with instant AI credit screening, get a TrustKey match score
- **For Sellers/Landlords:** List properties, set screening criteria, view applicant match scores with color-coded ratings (Green = 80+, Yellow = 50-79, Red = below 50)
- **AI Chatbot:** You! Helping users find properties and answer questions
- **Screening powered by CRS:** Credit reports, eviction history, bankruptcy, criminal background, and fraud/identity checks

## How the Match Score Works
When a buyer applies, TrustKey runs a credit screening and calculates a match score (0-100) based on:
1. **Credit Score** (25 points) — compared to the seller's minimum requirement
2. **Eviction History** (20 points) — clean record scores full points
3. **Bankruptcy History** (20 points) — no bankruptcy scores full points
4. **Criminal History** (20 points) — clean record scores full points
5. **Fraud/Identity** (15 points) — no flags scores full points

## Currently Available Listings
${listingSummaries || 'No listings available at the moment.'}

## How to Use TrustKey
1. **Browse** listings on the home page (filter by city, rent/buy)
2. **Click** on a property to see full details
3. **Sign up** as a Buyer or Seller
4. **Apply** to a property — your credit gets screened instantly
5. **View results** — sellers see your match score on their dashboard

Answer user questions helpfully. If they ask about specific properties, reference the listings above. If they ask general real estate questions, answer using your knowledge. Always use markdown formatting with **bold text**, bullet points, headings, and clear structure.`,
        displayName: "TrustKey Platform",
      });
    }
  }, [isOpen, location.pathname, allListings, addContextAttachment, clearContextAttachments]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;

    const result = await submit();
    if (!threadId && result?.threadId) {
      setThreadId(result.threadId);
    }
  };

  const extractTextContent = (content: any): string => {
    if (Array.isArray(content)) {
      return content
        .map((c) => {
          if (typeof c === "string") return c;
          if (c && typeof c === "object" && "text" in c) return c.text;
          return "";
        })
        .join("");
    }
    return typeof content === "string" ? content : "";
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
            title="Chat with AI"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            style={{ height: isMinimized ? "auto" : "600px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
                <span className="font-semibold text-primary-foreground">
                  AI Assistant
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="rounded p-1 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div
                  ref={scrollRef}
                  className="flex-1 space-y-4 overflow-y-auto p-4"
                >
                  {/* Initial greeting if no messages */}
                  {messages.length === 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm">
                        <p className="font-medium">Hi! I'm your AI assistant.</p>
                        <p className="mt-1 text-muted-foreground">
                          {location.pathname.startsWith('/listing/')
                            ? "Ask me anything about this property - amenities, pricing, application process, or neighborhood details!"
                            : "I can help you with questions about properties, the application process, and more!"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Render messages */}
                  {messages.map((m, i) => {
                    const textContent = extractTextContent(m.content);
                    const isUser = m.role === "user";

                    return (
                      <div
                        key={i}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                            isUser
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md bg-muted text-foreground"
                          }`}
                        >
                          {isUser ? (
                            textContent
                          ) : (
                            <div className="tambo-markdown">
                              <ReactMarkdown
                                components={{
                                  h1: ({ children }) => (
                                    <h1 className="mb-2 mt-1 text-base font-bold">{children}</h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="mb-2 mt-1 text-sm font-bold">{children}</h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="mb-1 mt-1 text-sm font-semibold">{children}</h3>
                                  ),
                                  p: ({ children }) => (
                                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="leading-relaxed">{children}</li>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-semibold">{children}</strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className="italic">{children}</em>
                                  ),
                                  code: ({ children }) => (
                                    <code className="rounded bg-background/50 px-1 py-0.5 text-xs font-mono">{children}</code>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="mb-2 border-l-2 border-border pl-3 italic text-muted-foreground">{children}</blockquote>
                                  ),
                                  hr: () => (
                                    <hr className="my-2 border-border" />
                                  ),
                                  a: ({ children, href }) => (
                                    <a href={href} className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>
                                  ),
                                }}
                              >
                                {textContent}
                              </ReactMarkdown>
                            </div>
                          )}
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
                <div className="border-t border-border bg-background p-3">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Ask me anything..."
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                      disabled={isPending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isPending || !value.trim()}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
