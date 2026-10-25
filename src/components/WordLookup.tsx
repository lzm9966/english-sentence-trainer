import { useState, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';
import { capabilityClient } from '@lark-apaas/client-toolkit-lite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import SpeakButton from './SpeakButton';

interface WordLookupProps {
  /** 被点击的单词 */
  word: string;
  /** 上下文句子 */
  context: string;
  /** 触发元素 */
  children: React.ReactNode;
}

const WORD_PLUGIN_ID = 'word_definition_generator_6';

/**
 * 点词查义悬浮组件
 * 点击单词后弹出释义，调用 AI 生成
 */
export default function WordLookup({ word, context, children }: WordLookupProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const handleOpenChange = useCallback(
    async (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen && !content) {
        setLoading(true);
        setContent('');
        try {
          const executor = (capabilityClient as any).load(WORD_PLUGIN_ID);
          const stream = (executor as any).callStream('textGenerate', {
            target_word: word,
            context_sentence: context,
          });
          let full = '';
          for await (const chunk of stream) {
            const piece = chunk.content ?? chunk.response ?? '';
            if (piece) {
              full += piece;
              setContent(full);
            }
          }
        } catch (err) {
          setContent('> 释义加载失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      }
    },
    [word, context, content]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer border-b border-dotted border-primary/40 hover:text-primary hover:border-primary transition-colors">
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-h-[360px] overflow-y-auto p-4 text-sm"
        side="top"
        align="start"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-base text-foreground">{word}</p>
          <SpeakButton text={word} size="sm" />
        </div>
        {loading && !content && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            正在查询释义...
          </div>
        )}
        {content && (
          <article className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * 将一段英文文本中的每个单词包装为可点击查义的组件
 * 标点符号和非英文字符不包装
 */
interface ClickableTextProps {
  text: string;
  /** 用于上下文的完整句子 */
  fullSentence: string;
  className?: string;
}

export function ClickableText({ text, fullSentence, className }: ClickableTextProps) {
  // 按单词切分，保留标点
  const parts = text.split(/(\b[a-zA-Z]+[a-zA-Z'-]*\b)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        // 是英文单词且长度 > 1
        if (/^[a-zA-Z][a-zA-Z'-]*$/.test(part) && part.length > 1) {
          return (
            <WordLookup key={i} word={part} context={fullSentence}>
              {part}
            </WordLookup>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
