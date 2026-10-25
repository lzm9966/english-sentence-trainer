import { useState, useCallback, type FormEvent } from 'react';
import { Sparkles, Loader2, BookOpen, BookMarked } from 'lucide-react';
import { capabilityClient } from '@lark-apaas/client-toolkit-lite';
import { toast } from 'sonner';
import type { ISentenceTemplate, IVocabularyItem } from '@/data/drill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const EXTRACTOR_PLUGIN_ID = 'english_essay_sentence_template_extractor_1';

interface PasteEssaySectionProps {
  onAnalysisComplete: (data: {
    templates: ISentenceTemplate[];
    summaryVocab: IVocabularyItem[];
  }) => void;
  onOpenLibrary?: () => void;
}

const SAMPLE_ESSAY = `Artificial intelligence has revolutionized the way people work and live in modern society. While some argue that AI may replace human jobs and cause widespread unemployment, others believe that technological progress will create new opportunities and industries. In fact, the impact of AI on employment depends on how societies adapt to these changes.

Governments should invest in education and training programs to help workers acquire the skills needed for the future job market. Furthermore, companies have a responsibility to support their employees through career transitions, rather than simply replacing them with machines. By combining technological innovation with thoughtful social policies, we can ensure that the benefits of AI are shared by all members of society.`;

export default function PasteEssaySection({ onAnalysisComplete, onOpenLibrary }: PasteEssaySectionProps) {
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!essay.trim() || loading) return;

      setLoading(true);
      try {
        const executor = (capabilityClient as any).load(EXTRACTOR_PLUGIN_ID);
        const result = await (executor as any).call('textToJson', {
          english_essay_content: essay.trim(),
        });

        const templates = (result.sentenceTemplates ?? []) as ISentenceTemplate[];
        const summaryVocab = (result.summaryVocabulary ?? []) as IVocabularyItem[];

        if (templates.length === 0) {
          toast.error('未能分析出句式，请检查范文内容是否有效');
          return;
        }

        // 保存到 localStorage
        try {
          localStorage.setItem(
            '__app_essay_drill_currentEssay',
            essay.trim()
          );
          localStorage.setItem(
            '__app_essay_drill_sentenceTemplates',
            JSON.stringify(templates)
          );
        } catch {
          // 忽略存储失败
        }

        onAnalysisComplete({ templates, summaryVocab });
        toast.success(`已提取 ${templates.length} 个句式骨架`);
      } catch (err) {
        toast.error('AI 分析失败，请重试');
      } finally {
        setLoading(false);
      }
    },
    [essay, loading, onAnalysisComplete]
  );

  const useSample = useCallback(() => {
    setEssay(SAMPLE_ESSAY);
  }, []);

  return (
    <section className="w-full">
      <div className="max-w-2xl mx-auto">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="size-5" />
                <CardTitle className="text-lg">英语写作句式背诵练习</CardTitle>
              </div>
              {onOpenLibrary && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-8 text-xs"
                  onClick={onOpenLibrary}
                >
                  <BookMarked className="size-3.5 mr-1" />
                  我的范文
                </Button>
              )}
            </div>
            <CardDescription className="text-sm">
              粘贴一篇范文，AI 逐句提取固定句式骨架，通过多主题替换填空的方式帮你背诵好词好句
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="essay-input" className="text-sm font-medium">
                    范文内容
                  </Label>
                  <button
                    type="button"
                    onClick={useSample}
                    className="text-xs text-primary hover:underline"
                  >
                    使用示例范文
                  </button>
                </div>
                <Textarea
                  id="essay-input"
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  placeholder="在此粘贴雅思/四六级/考研英语写作范文..."
                  className="min-h-[240px] text-base leading-relaxed resize-none"
                />
                <div className="text-xs text-muted-foreground text-right">
                  字数：{essay.length}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-base h-12"
                disabled={!essay.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    开始分析句式
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center pt-1">
                💡 全程打字练习，无需语音朗读，适合图书馆静音环境
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
