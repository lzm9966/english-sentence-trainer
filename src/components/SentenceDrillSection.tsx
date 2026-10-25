import { useState, useCallback, useEffect, type FormEvent } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  BookOpen,
  Loader2,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { capabilityClient } from '@lark-apaas/client-toolkit-lite';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ISentenceTemplate, IThemePractice } from '@/data/drill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClickableText } from './WordLookup';
import SpeakButton from './SpeakButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TOPIC_PLUGIN_ID = 'english_writing_topic_generator_2';
const CORRECTION_PLUGIN_ID = 'fill_in_blank_correction_assistant_3';
const GRAMMAR_PLUGIN_ID = 'grammar_explanation_generator_4';

interface SentenceDrillSectionProps {
  template: ISentenceTemplate;
  sentenceIndex: number;
  totalSentences: number;
  onMastered: () => void;
}

/**
 * 解析 AI 生成的主题 markdown，提取出 2-3 个主题
 * 返回主题名称数组
 */
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

export default function SentenceDrillSection({
  template,
  sentenceIndex,
  totalSentences,
  onMastered,
}: SentenceDrillSectionProps) {
  const [themes, setThemes] = useState<string[]>([]);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeContent, setThemeContent] = useState('');
  const [currentThemeIdx, setCurrentThemeIdx] = useState(0);

  const [answers, setAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [correctionResult, setCorrectionResult] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [grammarOpen, setGrammarOpen] = useState(false);
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [grammarContent, setGrammarContent] = useState('');

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const generateThemes = useCallback(async () => {
    setThemeLoading(true);
    setThemeContent('');
    setThemes([]);
    try {
      const executor = (capabilityClient as any).load(TOPIC_PLUGIN_ID);
      const stream = (executor as any).callStream('textGenerate', {
        sentence_framework: template.skeleton,
        original_topic: template.originalSentence.substring(0, 100),
      });
      let full = '';
      for await (const chunk of stream) {
        const piece = chunk.content ?? chunk.response ?? '';
        if (piece) {
          full += piece;
          setThemeContent(full);
        }
      }
      const parsed = parseThemesFromMarkdown(full);
      if (parsed.length > 0) {
        setThemes(parsed);
      } else {
        toast.error('主题生成失败，请重试');
        setThemes([]);
      }
    } catch {
      toast.error('主题生成失败，请重试');
      setThemes([]);
    } finally {
      setThemeLoading(false);
    }
  }, [template.skeleton, template.originalSentence]);

  // 初始化答案数组（空位数量变化时重置）
  useEffect(() => {
    if (answers.length !== template.blanks.length) {
      setAnswers(new Array(template.blanks.length).fill(''));
    }
  }, [template.blanks.length, answers.length]);

  // 当切换句子时重置状态并生成新主题
  useEffect(() => {
    setThemes([]);
    setThemeContent('');
    setCurrentThemeIdx(0);
    setAnswers(new Array(template.blanks.length).fill(''));
    setCorrectionResult('');
    setHasSubmitted(false);
    setGrammarOpen(false);
    setGrammarContent('');
    generateThemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  const handleAnswerChange = useCallback((idx: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (answers.some((a) => !a.trim()) || submitting) return;

      setSubmitting(true);
      setCorrectionResult('');
      try {
        // 构建完整句子（用用户答案替换空位）
        let fullSentence = template.skeleton;
        const blankParts: string[] = [];
        template.blanks.forEach((blank, i) => {
          fullSentence = fullSentence.replace('___', `【${answers[i]}】`);
          blankParts.push(answers[i]);
        });

        const executor = (capabilityClient as any).load(CORRECTION_PLUGIN_ID);
        const stream = (executor as any).callStream('textGenerate', {
          original_sentence: template.skeleton,
          user_answer: `填空内容：${blankParts.join(' / ')}\n组合后的句子：${fullSentence}`,
          additional_requirements: `当前练习主题：${themes[currentThemeIdx] || '通用主题'}。请围绕该主题批改用户造句是否合理。`,
        });

        let full = '';
        for await (const chunk of stream) {
          const piece = chunk.content ?? chunk.response ?? '';
          if (piece) {
            full += piece;
            setCorrectionResult(full);
          }
        }
        setHasSubmitted(true);
      } catch {
        toast.error('批改失败，请重试');
      } finally {
        setSubmitting(false);
      }
    },
    [answers, submitting, template.skeleton, template.blanks, themes, currentThemeIdx]
  );

  const loadGrammar = useCallback(async () => {
    if (grammarContent) return;
    setGrammarLoading(true);
    try {
      const executor = (capabilityClient as any).load(GRAMMAR_PLUGIN_ID);
      const stream = (executor as any).callStream('textGenerate', {
        sentence_content: template.originalSentence,
      });
      let full = '';
      for await (const chunk of stream) {
        const piece = chunk.content ?? chunk.response ?? '';
        if (piece) {
          full += piece;
          setGrammarContent(full);
        }
      }
    } catch {
      toast.error('语法讲解加载失败');
    } finally {
      setGrammarLoading(false);
    }
  }, [template.originalSentence, grammarContent]);

  const handleGrammarToggle = useCallback(() => {
    const next = !grammarOpen;
    setGrammarOpen(next);
    if (next) {
      loadGrammar();
    }
  }, [grammarOpen, loadGrammar]);

  const switchTheme = useCallback(
    (direction: number) => {
      const newIdx = currentThemeIdx + direction;
      if (newIdx < 0 || newIdx >= themes.length) return;
      setCurrentThemeIdx(newIdx);
      setAnswers(new Array(template.blanks.length).fill(''));
      setCorrectionResult('');
      setHasSubmitted(false);
    },
    [currentThemeIdx, themes.length, template.blanks.length]
  );

  const handleMastered = useCallback(() => {
    setConfirmDialogOpen(true);
  }, []);

  const confirmMastered = useCallback(() => {
    setConfirmDialogOpen(false);
    onMastered();
    toast.success('已过关！进入下一句');
  }, [onMastered]);

  const currentTheme = themes[currentThemeIdx] || '';

  // 渲染句式骨架 + 填空输入框
  const renderSkeletonWithInputs = () => {
    const parts = template.skeleton.split('___');
    return (
      <div className="flex flex-wrap items-center gap-y-3 text-lg leading-relaxed">
        {parts.map((part, i) => (
          <div key={i} className="contents">
            {part && (
              <ClickableText
                text={part}
                fullSentence={template.originalSentence}
                className="text-foreground/90"
              />
            )}
            {i < parts.length - 1 && (
              <div className="inline-flex flex-col mx-1 relative">
                <Input
                  value={answers[i] || ''}
                  onChange={(e) => handleAnswerChange(i, e.target.value)}
                  placeholder={template.blanks[i]?.grammaticalRole || `空位 ${i + 1}`}
                  className="min-w-[120px] w-auto inline-block h-9 text-base px-2"
                />
                {template.blanks[i]?.grammaticalRole && (
                  <span className="text-[10px] text-muted-foreground mt-0.5 text-center">
                    {template.blanks[i].grammaticalRole}
                  </span>
                )}
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
        {/* 句式卡片 */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="size-5" />
                <CardTitle className="text-lg">
                  第 {sentenceIndex + 1} 句
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <SpeakButton text={template.originalSentence} size="xs" />
                <div className="flex flex-wrap gap-1">
                  {template.grammarTags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs h-5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <CardDescription className="text-sm pt-1">
              <ClickableText
                text={template.originalSentence}
                fullSentence={template.originalSentence}
              />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 句式骨架 + 填空 */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border/40">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">句式骨架：</p>
                <SpeakButton
                  text={template.skeleton.replace(/___/g, 'blank')}
                  size="xs"
                />
              </div>
              {renderSkeletonWithInputs()}
            </div>

            {/* 主题提示 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge className="shrink-0">当前主题</Badge>
                {themeLoading ? (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    生成中...
                  </span>
                ) : currentTheme ? (
                  <span className="text-sm font-medium text-foreground truncate">
                    {currentTheme}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    主题生成失败
                  </span>
                )}
              </div>
              {!themeLoading && themes.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateThemes}
                  className="shrink-0 h-7 text-xs"
                >
                  <RefreshCw className="size-3 mr-1" />
                  重试
                </Button>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => switchTheme(-1)}
                  disabled={currentThemeIdx === 0 || themes.length === 0}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">
                  {themes.length > 0
                    ? `${currentThemeIdx + 1}/${themes.length}`
                    : '-/-'}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => switchTheme(1)}
                  disabled={
                    currentThemeIdx >= themes.length - 1 || themes.length === 0
                  }
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* 提交按钮 */}
            <form onSubmit={handleSubmit}>
              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={
                  answers.some((a) => !a.trim()) ||
                  submitting ||
                  themes.length === 0
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    批改中...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    提交答案 / AI 批改
                  </>
                )}
              </Button>
            </form>

            {/* 语法讲解按钮 */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGrammarToggle}
            >
              <Lightbulb className="size-4" />
              {grammarOpen ? '收起语法讲解' : '查看语法讲解'}
            </Button>

            {/* 语法讲解面板 */}
            {grammarOpen && (
              <div className="p-4 bg-accent/20 rounded-lg border border-accent/30">
                {grammarLoading && !grammarContent && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    正在生成语法讲解...
                  </div>
                )}
                {grammarContent && (
                  <article className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {grammarContent}
                    </ReactMarkdown>
                  </article>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 批改结果 */}
        {hasSubmitted && correctionResult && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="size-4 text-primary" />
                  AI 批改结果
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <article className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {correctionResult}
                </ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        )}

        {/* 过关按钮 */}
        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  这句练得怎么样？
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  可以切换主题多练几次，觉得熟练了就点过关
                </p>
              </div>
              <Button onClick={handleMastered}>
                <CheckCircle2 className="size-4" />
                这句过关
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 过关确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认这句过关？</AlertDialogTitle>
            <AlertDialogDescription>
              过关后将解锁下一句练习。已练习主题数：{hasSubmitted ? currentThemeIdx + 1 : 0}
              / {themes.length || '-'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>再练练</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMastered}>
              确认过关
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
