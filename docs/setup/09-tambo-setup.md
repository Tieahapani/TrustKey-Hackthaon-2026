# 9. Tambo AI Setup

Tambo AI provides the chat UI toolkit and voice input (speech-to-text) for our property chatbot.

## Step 1: Create a Tambo Account

1. Go to https://tambo.co/
2. Sign up for a free account

## Step 2: Get Your API Key

1. After signing in, go to your dashboard
2. Find your **API Key** in settings or the project page
3. Copy the API key

## Step 3: Update `.env`

Add to `frontend/.env`:

```
VITE_TAMBO_API_KEY=your_tambo_api_key_here
```

## How We Use Tambo

In our project, Tambo provides:

1. **`useTamboVoice()` hook** — Records audio from the microphone and transcribes it to text (speech-to-text)
2. The transcribed text is then sent to our backend, which queries Gemini for an answer

### Voice Input Flow:
```
User clicks mic → Tambo records audio → Tambo transcribes to text →
Text sent to backend → Gemini answers → ElevenLabs speaks the answer
```

## Current Implementation Note

The chat component (`PropertyChat.tsx`) currently uses the browser's built-in Web Speech API as a fallback for speech-to-text. To integrate Tambo's `useTamboVoice()`:

1. Wrap the component with `TamboProvider` (in `App.tsx` or `main.tsx`):

```tsx
import { TamboProvider } from '@tambo-ai/react';

// Wrap your app:
<TamboProvider apiKey={import.meta.env.VITE_TAMBO_API_KEY} userKey="user-1">
  <App />
</TamboProvider>
```

2. Use the `useTamboVoice()` hook in `PropertyChat.tsx`:

```tsx
import { useTamboVoice } from '@tambo-ai/react';

const {
  startRecording,
  stopRecording,
  isRecording,
  isTranscribing,
  transcript,
} = useTamboVoice();
```

This is already partially set up — the `@tambo-ai/react` package is installed.

## Troubleshooting

**"TamboProvider not found":**
- Make sure `@tambo-ai/react` is installed: `cd frontend && npm install @tambo-ai/react`

**Voice recording doesn't work:**
- Browser needs microphone permission — click "Allow" when prompted
- Must be on HTTPS or localhost (mic doesn't work on plain HTTP)
- Try Chrome (best support for Web Speech API)

**Transcription is empty:**
- Make sure you're speaking clearly and close to the mic
- Check that the Tambo API key is valid
