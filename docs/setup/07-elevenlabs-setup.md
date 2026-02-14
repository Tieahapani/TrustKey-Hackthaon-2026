# 7. ElevenLabs Setup (Text-to-Speech)

ElevenLabs converts the AI chatbot's text answers into spoken audio. The buyer hears the response read aloud.

## Step 1: Create an ElevenLabs Account

1. Go to https://elevenlabs.io/
2. Sign up (free tier gives you 10,000 characters/month)

## Step 2: Get Your API Key

1. Click your profile icon (top right) > **Profile + API key**
2. Or go directly to: https://elevenlabs.io/app/settings/api-keys
3. Copy your **API Key**

## Step 3: Choose a Voice

1. Go to https://elevenlabs.io/app/voice-library
2. Browse voices and find one you like
3. Click on a voice to hear a preview
4. Click **"Use"** or **"Add to My Voices"**
5. Go to **My Voices** (https://elevenlabs.io/app/voice-lab)
6. Click on the voice you chose
7. Copy the **Voice ID** from the URL or the voice details panel

### Recommended voices for a property assistant:
- **Sarah** (Voice ID: `EXAVITQu4vr4xnSDxMaL`) — friendly, professional
- **Rachel** (Voice ID: `21m00Tcm4TlvDq8ikWAM`) — warm, conversational
- **Adam** (Voice ID: `pNInz6obpgDQGcFmaJgB`) — clear, authoritative

You can use the default (Sarah) if you're not sure.

## Step 4: Update `.env`

Add to `backend/.env`:

```
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

Replace the voice ID with whichever voice you picked.

## Step 5: Test It

```bash
cd backend
node -e "
  require('dotenv').config();
  const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  client.textToSpeech.convert(process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL', {
    text: 'Welcome to HomeScreen, your AI-powered housing marketplace.',
    model_id: 'eleven_flash_v2_5'
  }).then(() => console.log('TTS works!')).catch(e => console.error('Error:', e.message));
"
```

## How We Use It

1. Buyer asks a question (text or voice)
2. Gemini generates a text answer
3. The text answer is sent to ElevenLabs
4. ElevenLabs returns an audio stream (MP3)
5. The browser plays the audio so the buyer hears the answer

## Free Tier Limits

- 10,000 characters/month
- That's roughly 100-200 short answers
- For the hackathon demo, this is plenty
- You can disable TTS in the chat widget (speaker icon) to save quota

## Troubleshooting

**"401 Unauthorized":**
- API key is wrong. Copy it again from ElevenLabs settings

**"Voice not found":**
- Voice ID is wrong. Go to My Voices and copy the correct ID

**Audio plays but sounds weird:**
- Try a different voice
- Make sure `model_id` is `eleven_flash_v2_5` (fastest) or `eleven_multilingual_v2` (highest quality)

**No audio playing in browser:**
- Check browser console for errors
- Make sure the browser allows audio playback (Chrome blocks autoplay sometimes)
- Click somewhere on the page first, then try the chat
