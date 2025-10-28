import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mic, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AISearchBarProps {
  onCommand: (command: string) => void;
  language?: 'en' | 'ms';
  onFocus?: () => void;
}

export function AISearchBar({ onCommand, language = 'en', onFocus }: AISearchBarProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: language === 'ms' ? 'Rakaman Dimulakan' : 'Recording Started',
        description: language === 'ms' ? 'Tekan sekali lagi untuk berhenti' : 'Click again to stop',
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: language === 'ms' ? 'Gagal memulakan rakaman' : 'Failed to start recording',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // Send to voice-to-text function
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio, language }
        });

        if (error) throw error;

        if (data.text) {
          onCommand(data.text);
          
          toast({
            title: language === 'ms' ? 'Transkripsi Berjaya' : 'Transcription Success',
            description: data.text,
          });
        }
      };

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: language === 'ms' ? 'Gagal memproses audio' : 'Failed to process audio',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={onFocus}
          placeholder={language === 'ms' ? 'Tanya ZENI AI...' : 'Ask ZENI AI...'}
          className="pl-10 pr-4"
          disabled={isRecording || isProcessing}
        />
      </div>
      
      <Button
        type="button"
        variant={isRecording ? 'destructive' : 'outline'}
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
        )}
      </Button>

      <Button type="submit" disabled={!input.trim() || isRecording || isProcessing}>
        {language === 'ms' ? 'Hantar' : 'Send'}
      </Button>
    </form>
  );
}
