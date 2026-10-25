import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import type { ISentenceTemplate, IVocabularyItem } from '@/data/drill';
import type { IEssayRecord } from '@/data/essayLibrary';
import {
  loadEssayLibrary,
  saveEssayRecord,
  generateEssayTitle,
} from '@/data/essayLibrary';
import ProgressBar from '@/components/ProgressBar';
import EssayPanel from '@/components/EssayPanel';
import PasteEssaySection from '@/components/PasteEssaySection';
import TemplateListSection from '@/components/TemplateListSection';
import SentenceDrillSection from '@/components/SentenceDrillSection';
import FullEssaySection from '@/components/FullEssaySection';
import EssayLibraryDialog from '@/components/EssayLibraryDialog';
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

type Phase = 'paste' | 'templates' | 'drill' | 'full';

const STORAGE_ESSAY = '__app_essay_drill_currentEssay';
const STORAGE_TEMPLATES = '__app_essay_drill_sentenceTemplates';
const STORAGE_PROGRESS = '__app_essay_drill_progress';
const STORAGE_RECORD_ID = '__app_essay_drill_recordId';

interface IDrillProgressStored {
  currentSentenceIndex: number;
  masteredSentenceIds: string[];
  isFullEssayPhase: boolean;
}

function readStorage(): {
  essay: string;
  templates: ISentenceTemplate[];
  progress: IDrillProgressStored | null;
} {
  try {
    const essay = localStorage.getItem(STORAGE_ESSAY) || '';
    const templatesRaw = localStorage.getItem(STORAGE_TEMPLATES);
    const progressRaw = localStorage.getItem(STORAGE_PROGRESS);
    const templates = templatesRaw ? JSON.parse(templatesRaw) : [];
    const progress = progressRaw ? JSON.parse(progressRaw) : null;
    return { essay, templates, progress };
  } catch {
    return { essay: '', templates: [], progress: null };
  }
}

function persistProgress(
  currentSentenceIndex: number,
  masteredSentenceIds: string[],
  isFullEssayPhase: boolean
) {
  try {
    localStorage.setItem(
      STORAGE_PROGRESS,
      JSON.stringify({
        currentSentenceIndex,
        masteredSentenceIds,
        isFullEssayPhase,
      })
    );
  } catch {
    // ignore
  }
}

export default function SentenceDrillApp() {
  const [phase, setPhase] = useState<Phase>('paste');
  const [essay, setEssay] = useState('');
  const [templates, setTemplates] = useState<ISentenceTemplate[]>([]);
  const [summaryVocab, setSummaryVocab] = useState<IVocabularyItem[]>([]);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  // 当前范文的记录 ID（用于同步进度到范文库）
  const currentRecordIdRef = useRef<string>('');

  // 我的范文弹窗
  const [libraryOpen, setLibraryOpen] = useState(false);

  // 历史进度恢复
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [pendingResume, setPendingResume] = useState<{
    essay: string;
    templates: ISentenceTemplate[];
    progress: IDrillProgressStored;
  } | null>(null);

  useEffect(() => {
    const stored = readStorage();
    if (
      stored.essay &&
      stored.templates.length > 0 &&
      stored.progress &&
      !stored.progress.isFullEssayPhase
    ) {
      setPendingResume({
        essay: stored.essay,
        templates: stored.templates,
        progress: stored.progress,
      });
      setResumeDialogOpen(true);
    }
  }, []);

  const total = templates.length;

  // 保存当前范文进度到范文库
  const saveCurrentToLibrary = useCallback(
    ({
      currentSentenceIndex,
      masteredSentenceIds,
      isFullEssayPhase,
    }: {
      currentSentenceIndex: number;
      masteredSentenceIds: string[];
      isFullEssayPhase: boolean;
    }) => {
      if (!currentRecordIdRef.current || templates.length === 0) return;
      const record: IEssayRecord = {
        id: currentRecordIdRef.current,
        title: generateEssayTitle(essay, templates),
        essay,
        templates,
        summaryVocab,
        masteredSentenceIds,
        currentSentenceIndex,
        isFullEssayPhase,
        savedAt: new Date().toISOString(),
      };
      saveEssayRecord(record);
    },
    [essay, templates, summaryVocab]
  );

  const handleAnalysisComplete = useCallback(
    (data: { templates: ISentenceTemplate[]; summaryVocab: IVocabularyItem[] }) => {
      setTemplates(data.templates);
      setSummaryVocab(data.summaryVocab);
      const essayText = data.templates.map((t) => t.originalSentence).join(' ');
      setEssay(essayText);
      setPhase('templates');
      setCurrentSentenceIdx(0);
      setMasteredIds([]);

      // 创建/更新范文库记录
      const recordId = `essay_${Date.now()}`;
      currentRecordIdRef.current = recordId;
      const record: IEssayRecord = {
        id: recordId,
        title: generateEssayTitle(essayText, data.templates),
        essay: essayText,
        templates: data.templates,
        summaryVocab: data.summaryVocab,
        masteredSentenceIds: [],
        currentSentenceIndex: 0,
        isFullEssayPhase: false,
        savedAt: new Date().toISOString(),
      };
      saveEssayRecord(record);

      // 持久化当前练习
      try {
        localStorage.setItem(STORAGE_ESSAY, essayText);
        localStorage.setItem(STORAGE_TEMPLATES, JSON.stringify(data.templates));
        localStorage.setItem(STORAGE_RECORD_ID, recordId);
      } catch {
        // ignore
      }
      persistProgress(0, [], false);
    },
    []
  );

  const handleStartDrill = useCallback(() => {
    setPhase('drill');
    setCurrentSentenceIdx(0);
    setMasteredIds([]);
    persistProgress(0, [], false);
  }, []);

  const handleSentenceMastered = useCallback(() => {
    const currentId = templates[currentSentenceIdx]?.id;
    if (!currentId) return;

    const newMastered = [...masteredIds, currentId];
    setMasteredIds(newMastered);

    if (currentSentenceIdx < templates.length - 1) {
      const nextIdx = currentSentenceIdx + 1;
      setCurrentSentenceIdx(nextIdx);
      persistProgress(nextIdx, newMastered, false);
      saveCurrentToLibrary({
        currentSentenceIndex: nextIdx,
        masteredSentenceIds: newMastered,
        isFullEssayPhase: false,
      });
    } else {
      // 全部练完，进入整篇套用
      setPhase('full');
      persistProgress(currentSentenceIdx, newMastered, true);
      saveCurrentToLibrary({
        currentSentenceIndex: currentSentenceIdx,
        masteredSentenceIds: newMastered,
        isFullEssayPhase: true,
      });
    }
  }, [currentSentenceIdx, masteredIds, templates, saveCurrentToLibrary]);

  const handleRestart = useCallback(() => {
    setPhase('paste');
    setEssay('');
    setTemplates([]);
    setSummaryVocab([]);
    setCurrentSentenceIdx(0);
    setMasteredIds([]);
    currentRecordIdRef.current = '';
    try {
      localStorage.removeItem(STORAGE_ESSAY);
      localStorage.removeItem(STORAGE_TEMPLATES);
      localStorage.removeItem(STORAGE_PROGRESS);
      localStorage.removeItem(STORAGE_RECORD_ID);
    } catch {
      // ignore
    }
  }, []);

  const handleResume = useCallback(() => {
    if (!pendingResume) return;
    setEssay(pendingResume.essay);
    setTemplates(pendingResume.templates);
    setCurrentSentenceIdx(pendingResume.progress.currentSentenceIndex);
    setMasteredIds(pendingResume.progress.masteredSentenceIds);
    setPhase('drill');
    setResumeDialogOpen(false);
    setPendingResume(null);
    // 读取保存的 recordId
    try {
      const rid = localStorage.getItem(STORAGE_RECORD_ID);
      if (rid) currentRecordIdRef.current = rid;
    } catch {
      // ignore
    }
  }, [pendingResume]);

  // 从范文库恢复一篇练习
  const handleResumeFromLibrary = useCallback((record: IEssayRecord) => {
    setEssay(record.essay);
    setTemplates(record.templates);
    setSummaryVocab(record.summaryVocab);
    setCurrentSentenceIdx(record.currentSentenceIndex);
    setMasteredIds(record.masteredSentenceIds);
    currentRecordIdRef.current = record.id;
    if (record.isFullEssayPhase) {
      setPhase('full');
    } else if (record.templates.length > 0 && record.masteredSentenceIds.length === 0) {
      setPhase('templates');
    } else {
      setPhase('drill');
    }
    // 同步到本地存储
    try {
      localStorage.setItem(STORAGE_ESSAY, record.essay);
      localStorage.setItem(STORAGE_TEMPLATES, JSON.stringify(record.templates));
      localStorage.setItem(STORAGE_RECORD_ID, record.id);
    } catch {
      // ignore
    }
    persistProgress(
      record.currentSentenceIndex,
      record.masteredSentenceIds,
      record.isFullEssayPhase
    );
  }, []);

  const handleDiscardResume = useCallback(() => {
    setResumeDialogOpen(false);
    setPendingResume(null);
    try {
      localStorage.removeItem(STORAGE_ESSAY);
      localStorage.removeItem(STORAGE_TEMPLATES);
      localStorage.removeItem(STORAGE_PROGRESS);
    } catch {
      // ignore
    }
  }, []);

  // 进度条显示用的 sentence id 列表
  const sentenceIds = useMemo(
    () => templates.map((t) => t.id),
    [templates]
  );

  return (
    <div className="min-h-screen bg-background">
      <ProgressBar
        currentIndex={currentSentenceIdx}
        total={total}
        masteredIds={masteredIds}
        sentences={sentenceIds.map((id) => ({ id }))}
        phase={phase}
      />

      <main className="space-y-4 px-4 py-6 pb-16">
        {/* 范文原文折叠面板（非粘贴阶段显示） */}
        {phase !== 'paste' && essay && (
          <div className="max-w-2xl mx-auto">
            <EssayPanel essay={essay} />
          </div>
        )}

        {phase === 'paste' && (
          <PasteEssaySection
            onAnalysisComplete={handleAnalysisComplete}
            onOpenLibrary={() => setLibraryOpen(true)}
          />
        )}

        {phase === 'templates' && (
          <TemplateListSection
            templates={templates}
            summaryVocab={summaryVocab}
            onStartDrill={handleStartDrill}
          />
        )}

        {phase === 'drill' && templates[currentSentenceIdx] && (
          <SentenceDrillSection
            template={templates[currentSentenceIdx]}
            sentenceIndex={currentSentenceIdx}
            totalSentences={templates.length}
            onMastered={handleSentenceMastered}
          />
        )}

        {phase === 'full' && (
          <FullEssaySection templates={templates} onRestart={handleRestart} />
        )}
      </main>

      <Toaster position="top-center" />

      {/* 历史进度恢复对话框 */}
      <AlertDialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>发现未完成的练习</AlertDialogTitle>
            <AlertDialogDescription>
              检测到上次有未完成的练习进度（已过关{' '}
              {pendingResume?.progress.masteredSentenceIds.length ?? 0} /{' '}
              {pendingResume?.templates.length ?? 0} 句），是否继续上次的练习？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardResume}>
              重新开始
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>
              继续练习
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 我的范文库弹窗 */}
      <EssayLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onResume={handleResumeFromLibrary}
      />
    </div>
  );
}