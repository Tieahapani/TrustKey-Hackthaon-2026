# 6. Google Gemini API Setup

We use Gemini 2.0 Flash to power the AI property chatbot. It answers buyer questions about listings.

## Step 1: Get a Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API key"**
4. Select a Google Cloud project (or create a new one)
5. Copy the API key

## Step 2: Update `.env`

Add to `backend/.env`:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Step 3: Test It

```bash
cd backend
node -e "
  require('dotenv').config();
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  model.generateContent('Say hello in one sentence').then(r => {
    console.log('Gemini says:', r.response.text());
  }).catch(e => console.error('Error:', e.message));
"
```

If you see a response, it's working!

## How We Use It

- Every listing has an AI chatbot on its detail page
- When a buyer asks a question (text or voice), we send the question + listing data to Gemini
- Gemini answers based ONLY on the listing info (description, amenities, price, etc.)
- The answer is displayed in the chat and optionally spoken via ElevenLabs TTS

## Model: gemini-2.0-flash

- Very fast response times (good for chat)
- Good quality for Q&A tasks
- Free tier: 15 requests/minute, 1 million tokens/day

## Troubleshooting

**"API key not valid":**
- Make sure you copied the full key
- Check it hasn't expired — go back to AI Studio and verify

**"Model not found":**
- We use `gemini-2.0-flash`. If this model isn't available, try `gemini-1.5-flash`
- Update `backend/src/services/gemini.js` line with the model name

**Rate limit errors:**
- Free tier has limits. Wait a minute and try again
- For the hackathon demo, this should be plenty
