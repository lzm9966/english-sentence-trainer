import { useState, useCallback, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpeakButtonProps {
  /** 要朗读的文本 */
  text: string;
  /** 语言，默认英文 */
  lang?: string;
  /** 语速 0~1，默认 0.85（偏慢适合学习） */
  rate?: number;
  /** 按钮尺寸 */
  size?: 'sm' | 'xs';
  className?: string;
}

/**
 * TTS 朗读按钮
 * 使用浏览器原生 Web Speech API，无需后端
 */
export default function SpeakButton({
  text,
  lang = 'en-US',
  rate = 0.85,
  size = 'sm',
  className,
}: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
    }
  }, []);

  const handleSpeak = useCallback(() => {
    if (!text.trim() || !('speechSynthesis' in window)) return;

    // 如果正在朗读，先停止
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (speaking) {
        setSpeaking(false);
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1;

    // 优先选择英文语音
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.includes('Female')
    ) || voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) {
      utterance.voice = enVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [text, lang, rate, speaking]);

  if (!supported) return null;

  const sizeClass =
    size === 'xs'
      ? 'h-6 w-6 p-0 text-muted-foreground hover:text-foreground'
      : 'h-7 w-7 p-0 text-muted-foreground hover:text-foreground';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSpeak}
      className={`${sizeClass} shrink-0 ${className ?? ''}`}
      aria-label={speaking ? '停止朗读' : '朗读'}
      title={speaking ? '停止朗读' : '朗读'}
    >
      {speaking ? (
        <VolumeX className={size === 'xs' ? 'size-3.5' : 'size-4'} />
      ) : (
        <Volume2 className={size === 'xs' ? 'size-3.5' : 'size-4'} />
      )}
    </Button>
  );
}
