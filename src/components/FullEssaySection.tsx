import { useState, useCallback, useEffect, useMemo, type FormEvent } from 'react';
import {
  Sparkles,
  Loader2,
  Trophy,
  RotateCcw,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { capabilityClient } from '@lark-apaas/client-toolkit-lite';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ISentenceTemplate } from '@/data/drill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClickableText } from './WordLookup';
import SpeakButton from './SpeakButton';

const TOPIC_PLUGIN_ID = 'english_writing_topic_generator_2';
const GRADING_PLUGIN_ID = 'full_article_grading_polisher_5';

interface FullEssaySectionProps {
  templates: ISentenceTemplate[];
  onRestart: () => void;
}

function parseThemesFromMarkdown(md: string): string[] {
  const themes: string[] = [];
  const lines = md.split('\n');
  for (const line of lines) {
    const match = line.match(/^###\s*(?:主题\d+[:：]\s*)?(.+)$/);
    if (match) {
      themes.push(match[1].trim());
    }
  }
  return themes;
}

export default function FullEssaySection({ templates, onRestart }: FullEssaySectionProps) {
  const [themeMode, setThemeMode] = useState<'ai' | 'custom'>('ai');
  const [suggestedThemes, setSuggestedThemes] = useState<string[]>([]);
  const [themeLoading, setThemeLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');

  const [answers, setAnswers] = useState<string[][]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [gradingResult, setGradingResult] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // 初始化答案
  useEffect(() => {
    if (answers.length !== templates.length) {
      const initialAnswers = templates.map((tpl) =>
        new Array(tpl.blanks.length).fill('')
      );
      setAnswers(initialAnswers);
    }
  }, [templates, answers.length]);

  // 生成推荐主题
  const generateThemes = useCallback(async () => {
    setThemeLoading(true);
    setSuggestedThemes([]);
    try {
      const firstSkeleton = templates[0]?.skeleton || '';
      const executor = (capabilityClient as any).load(TOPIC_PLUGIN_ID);
      const stream = (executor as any).callStream('textGenerate', {
        sentence_framework: firstSkeleton,
        original_topic: '原文主题',
      });
      let full = '';
      for await (const chunk of stream) {
        const piece = chunk.content ?? chunk.response ?? '';
        if (piece) {
          full += piece;
        }
      }
      const parsed = parseThemesFromMarkdown(full);
      if (parsed.length > 0) {
        setSuggestedThemes(parsed.slice(0, 3));
      } else {
        toast.error('主题生成失败，请重试');
        setSuggestedThemes([]);
      }
    } catch {
      toast.error('主题生成失败，请重试');
      setSuggestedThemes([]);
    } finally {
      setThemeLoading(false);
    }
  }, [templates]);

  // 初始生成主题（仅在组件挂载时执行一次）
  useEffect(() => {
    if (suggestedThemes.length === 0 && !themeLoading) {
      generateThemes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswerChange = useCallback(
    (sentenceIdx: number, blankIdx: number, value: string) => {
      setAnswers((prev) => {
        const next = prev.map((arr) => [...arr]);
        next[sentenceIdx][blankIdx] = value;
        return next;
      });
    },
    []
  );

  const currentTheme = themeMode === 'ai' ? selectedTheme : customTheme;

  const allFilled = useMemo(() => {
    return answers.every((sentenceAnswers, i) =>
      sentenceAnswers.every((a, j) => a.trim().length > 0)
    );
  }, [answers]);

  const buildFullEssay = useCallback(() => {
    return templates
      .map((tpl, si) => {
        let sentence = tpl.skeleton;
        tpl.blanks.forEach((_, bi) => {
          sentence = sentence.replace('___', answers[si]?.[bi] || '___');
        });
        return sentence;
      })
      .join(' ');
  }, [templates, answers]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!allFilled || !currentTheme || submitting) return;

      setSubmitting(true);
      setGradingResult('');
      try {
        const fullEssay = buildFullEssay();
        const executor = (capabilityClient as any).load(GRADING_PLUGIN_ID);
        const stream = (executor as any).callStream('textGenerate', {
          original_article: `主题：${currentTheme}\n\n${fullEssay}`,
        });

        let full = '';
        for await (const chunk of stream) {
          const piece = chunk.content ?? chunk.response ?? '';
          if (piece) {
            full += piece;
            setGradingResult(full);
          }
        }
        setHasSubmitted(true);
      } catch {
        toast.error('整篇批改失败，请重试');
      } finally {
        setSubmitting(false);
      }
    },
    [allFilled, currentTheme, submitting, buildFullEssay]
  );

  // 渲染单句骨架 + 填空
  const renderSkeletonInputs = (tpl: ISentenceTemplate, sentenceIdx: number) => {
    const parts = tpl.skeleton.split('___');
    return (
      <div className="flex flex-wrap items-center gap-y-2 text-base leading-relaxed">
        {parts.map((part, i) => (
          <div key={i} className="contents">
            {part && (
              <ClickableText
                text={part}
                fullSentence={tpl.originalSentence}
                className="text-foreground/85"
              />
            )}
            {i < parts.length - 1 && (
              <div className="inline-flex flex-col mx-1 relative">
                <Input
                  value={answers[sentenceIdx]?.[i] || ''}
                  onChange={(e) => handleAnswerChange(sentenceIdx, i, e.target.value)}
                  placeholder={`空位${i + 1}`}
                  className="min-w-[100px] w-auto inline-block h-8 text-sm px-2"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="w-full">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* 完成提示 */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Trophy className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">
                恭喜完成逐句练习！
              </p>
              <p className="text-sm text-muted-foreground">
                现在把整篇范文的句式套用到一个全新主题上，试试写完整篇文章
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 主题选择 */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">选择新主题</CardTitle>
            <CardDescription className="text-sm">
              把整篇范文的句式套用到一个全新主题上
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs value={themeMode} onValueChange={(v) => setThemeMode(v as 'ai' | 'custom')}>
              <TabsList className="w-full">
                <TabsTrigger value="ai" className="flex-1">
                  <Wand2 className="size-3.5 mr-1" />
                  AI 推荐主题
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex-1">
                  自定义主题
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ai" className="pt-3">
                {themeLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="size-4 animate-spin" />
                    正在生成推荐主题...
                  </div>
                ) : suggestedThemes.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <p className="text-sm text-muted-foreground">暂无推荐主题</p>
                    <Button size="sm" onClick={generateThemes}>
                      <RefreshCw className="size-3 mr-1" />
                      重新生成
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suggestedThemes.map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setSelectedTheme(theme)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                          selectedTheme === theme
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border/50 hover:border-border hover:bg-muted/30'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateThemes}
                      className="text-xs w-full"
                    >
                      <RefreshCw className="size-3 mr-1" />
                      换一批
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="custom" className="pt-3">
                <Input
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="输入你想练习的主题，如：人工智能教育应用"
                  className="text-sm"
                />
              </TabsContent>
            </Tabs>
            {currentTheme && (
              <div className="pt-2 flex items-center gap-2">
                <Badge variant="outline">当前主题</Badge>
                <span className="text-sm font-medium">{currentTheme}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 整篇填空 */}
        {currentTheme && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">逐句填空</CardTitle>
              <CardDescription className="text-sm">
                围绕「{currentTheme}」把整篇范文改写出来
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((tpl, si) => (
                <div
                  key={tpl.id}
                  className="p-3 bg-muted/20 rounded-lg border border-border/40"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="shrink-0 size-5 flex items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                      {si + 1}
                    </span>
                    <span className="text-xs text-muted-foreground flex-1 min-w-0">
                      原句：
                      <ClickableText
                        text={tpl.originalSentence}
                        fullSentence={tpl.originalSentence}
                        className="text-xs"
                      />
                    </span>
                    <SpeakButton text={tpl.originalSentence} size="xs" />
                  </div>
                  {renderSkeletonInputs(tpl, si)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 提交批改 */}
        {currentTheme && (
          <form onSubmit={handleSubmit}>
            <Button
              type="submit"
              className="w-full h-12 text-base"
              size="lg"
              disabled={!allFilled || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  整篇批改中...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  提交整篇 / AI 批改打分
                </>
              )}
            </Button>
          </form>
        )}

        {/* 批改结果 */}
        {hasSubmitted && gradingResult && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="size-4 text-primary" />
                批改结果与润色版
              </CardTitle>
            </CardHeader>
            <CardContent>
              <article className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {gradingResult}
                </ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        )}

        {/* 重新开始 */}
        <Card className="border-border/50">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-medium">完成整篇练习</p>
              <p className="text-xs text-muted-foreground">
                可以重新粘贴一篇新范文继续练习
              </p>
            </div>
            <Button variant="outline" onClick={onRestart}>
              <RotateCcw className="size-4" />
              重新开始
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
