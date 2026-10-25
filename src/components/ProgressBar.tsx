import { memo } from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface ProgressBarProps {
  /** 当前句子索引（0-based） */
  currentIndex: number;
  /** 总句子数 */
  total: number;
  /** 已过关的句子 ID 集合 */
  masteredIds: string[];
  /** 所有句子模板（按顺序） */
  sentences: Array<{ id: string }>;
  /** 当前阶段：paste / templates / drill / full */
  phase: 'paste' | 'templates' | 'drill' | 'full';
}

function ProgressBar({ currentIndex, total, masteredIds, phase }: ProgressBarProps) {
  if (total === 0) return null;

  const phaseLabels: Record<string, string> = {
    paste: '粘贴范文',
    templates: '句式预览',
    drill: '逐句练习',
    full: '整篇套用',
  };

  const phases = ['paste', 'templates', 'drill', 'full'];
  const currentPhaseIdx = phases.indexOf(phase);

  return (
    <div className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md border-b border-border/40">
      <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
        {/* 阶段指示器 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {phases.map((p, i) => (
            <div key={p} className="flex items-center gap-1">
              <span
                className={
                  i < currentPhaseIdx
                    ? 'text-primary font-medium'
                    : i === currentPhaseIdx
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground'
                }
              >
                {phaseLabels[p]}
              </span>
              {i < phases.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>

        {/* 句子进度点（仅 drill 和 full 阶段显示） */}
        {(phase === 'drill' || phase === 'full') && total > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: total }).map((_, i) => {
              const isCurrent = i === currentIndex;
              const isMastered = masteredIds.length > i; // 顺序过关，前n个已过关
              return (
                <div
                  key={i}
                  className={`flex items-center justify-center shrink-0 w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isMastered
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isMastered && !isCurrent ? (
                    <Check className="size-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
              );
            })}
            <div className="shrink-0 text-xs text-muted-foreground ml-1">
              第 {currentIndex + 1} / {total} 句
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProgressBar);
