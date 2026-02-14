import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PropertyChatProps {
  listingId: string;
  listingTitle: string;
}

export default function PropertyChat({ listingId, listingTitle }: PropertyChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm the AI assistant for "${listingTitle}". Ask me anything about this property — parking, pets, neighborhood, move-in costs, or anything else!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send question to Gemini via backend
  const sendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: Message = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/chat', { listingId, question: question.trim() });
      const answer = res.data.answer;

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);

      // Text-to-Speech via ElevenLabs
      if (ttsEnabled) {
        playTTS(answer);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble answering that. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Play TTS audio from ElevenLabs
  const playTTS = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      const response = await api.post('/api/chat/tts', { text }, { responseType: 'blob' });
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (err) {
      console.error('TTS playback failed:', err);
      setIsPlayingAudio(false);
    }
  };

  // Voice recording using browser MediaRecorder + Tambo STT
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Use browser's SpeechRecognition API for transcription
        // (Tambo's useTamboVoice requires TamboProvider context — we use native API as fallback)
        try {
          const transcript = await transcribeAudio(blob);
          if (transcript) {
            setInput(transcript);
            sendMessage(transcript);
          }
        } catch {
          console.error('Transcription failed');
        } finally {
          setIsTranscribing(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to use voice input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Transcribe audio using browser's SpeechRecognition API
  const transcribeAudio = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Use Web Speech API for real-time transcription
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        // Fallback: prompt user to type
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = () => reject(new Error('Recognition failed'));
      recognition.start();

      // Auto-stop after 10 seconds
      setTimeout(() => {
        recognition.stop();
      }, 10000);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-card flex flex-col" style={{ height: '500px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">AI Property Assistant</span>
        </div>
        <button
          onClick={() => {
            setTtsEnabled(!ttsEnabled);
            if (isPlayingAudio && audioRef.current) {
              audioRef.current.pause();
              setIsPlayingAudio(false);
            }
          }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
        >
          {ttsEnabled ? (
            <Volume2 className="w-4 h-4 text-primary" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {isPlayingAudio && (
          <div className="flex justify-center">
            <span className="text-xs text-primary flex items-center gap-1">
              <Volume2 className="w-3 h-3 animate-pulse" /> Speaking...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading || isTranscribing}
          className={`p-2.5 rounded-xl transition-colors ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isTranscribing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? 'Listening...' : 'Ask about this property...'}
          disabled={loading || isRecording}
          className="flex-1 px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
