import { useState, memo } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { ClickableText } from './WordLookup';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SpeakButton from './SpeakButton';

interface EssayPanelProps {
  /** 范文原文 */
  essay: string;
}

function EssayPanel({ essay }: EssayPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!essay) return null;

  // 按句子切分
  const sentences = essay
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  return (
    <Card className="border-border/50 bg-card/60">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
          <FileText className="size-4 text-primary" />
          范文原文
          <span className="text-xs text-muted-foreground">
            ({sentences.length} 句)
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>
      </button>
      {expanded && (
        <CardContent className="pt-0 pb-4 space-y-2 text-sm leading-relaxed text-foreground/80">
          {sentences.map((sentence, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 text-xs text-muted-foreground w-5 mt-0.5">
                {i + 1}.
              </span>
              <p className="flex-1 text-sm leading-relaxed">
                <ClickableText text={sentence.trim()} fullSentence={sentence.trim()} />
              </p>
              <SpeakButton text={sentence.trim()} size="xs" className="mt-0.5" />
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export default memo(EssayPanel);
