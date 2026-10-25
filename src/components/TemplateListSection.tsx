import { useState, memo } from 'react';
import { ChevronDown, ChevronRight, Play, BookOpen, BookMarked } from 'lucide-react';
import type { ISentenceTemplate, IVocabularyItem } from '@/data/drill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClickableText } from './WordLookup';
import SpeakButton from './SpeakButton';

interface TemplateListSectionProps {
  templates: ISentenceTemplate[];
  summaryVocab: IVocabularyItem[];
  onStartDrill: () => void;
}

function TemplateListSection({ templates, summaryVocab, onStartDrill }: TemplateListSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(templates[0]?.id ?? null);
  const [vocabExpanded, setVocabExpanded] = useState(false);

  return (
    <section className="w-full">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="size-5" />
              <CardTitle className="text-lg">句式模板预览</CardTitle>
            </div>
            <CardDescription>
              AI 从范文中提取了 {templates.length} 个可复用句式骨架，点击展开查看原句
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((tpl, idx) => (
              <div
                key={tpl.id}
                className="border border-border/50 rounded-lg overflow-hidden bg-card"
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === tpl.id ? null : tpl.id)
                  }
                  className="w-full flex items-start gap-2 p-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="shrink-0 size-6 flex items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start gap-2">
                      <p className="text-base leading-relaxed flex-1 min-w-0">
                        <ClickableText
                          text={tpl.skeleton}
                          fullSentence={tpl.originalSentence}
                          className="text-foreground/90"
                        />
                      </p>
                      <SpeakButton
                        text={tpl.skeleton.replace(/___/g, 'blank')}
                        size="xs"
                        className="mt-1 shrink-0"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tpl.grammarTags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs font-normal h-5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-muted-foreground mt-1">
                    {expandedId === tpl.id ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </span>
                </button>
                {expandedId === tpl.id && (
                  <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/40 bg-muted/20">
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">原句：</p>
                        <SpeakButton text={tpl.originalSentence} size="xs" />
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        <ClickableText
                          text={tpl.originalSentence}
                          fullSentence={tpl.originalSentence}
                        />
                      </p>
                    </div>
                    {tpl.vocabulary.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">本句生词：</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tpl.vocabulary.map((v) => (
                            <span
                              key={v.word}
                              className="text-xs bg-background px-2 py-1 rounded-md border border-border/50"
                            >
                              <span className="font-medium text-foreground/90">
                                {v.word}
                              </span>
                              <span className="text-muted-foreground mx-1">·</span>
                              <span className="text-muted-foreground">{v.pos}</span>
                              <span className="text-muted-foreground mx-1">·</span>
                              <span className="text-foreground/80">{v.meaning}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 生词速查表 */}
        {summaryVocab.length > 0 && (
          <Card className="border-border/50 shadow-sm">
            <button
              onClick={() => setVocabExpanded(!vocabExpanded)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <BookMarked className="size-4 text-primary" />
                <span className="text-sm font-medium">全文生词速查表</span>
                <Badge variant="outline" className="text-xs">
                  {summaryVocab.length} 词
                </Badge>
              </div>
              {vocabExpanded ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </button>
            {vocabExpanded && (
              <CardContent className="pt-0 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {summaryVocab.map((v) => (
                    <div
                      key={v.word}
                      className="flex items-baseline gap-2 px-2 py-1.5 rounded-md bg-muted/30"
                    >
                      <span className="font-medium text-foreground/90 shrink-0">
                        {v.word}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {v.pos}
                      </span>
                      <span className="text-foreground/70 text-xs truncate">
                        {v.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <Button size="lg" className="w-full text-base h-12" onClick={onStartDrill}>
          <Play className="size-4" />
          开始逐句练习
        </Button>
      </div>
    </section>
  );
}

export default memo(TemplateListSection);
