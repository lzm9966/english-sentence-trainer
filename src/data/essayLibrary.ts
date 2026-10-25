// EXPORTS: IEssayRecord, ESSAY_LIBRARY_KEY, loadEssayLibrary, saveEssayRecord, deleteEssayRecord, generateEssayTitle
// 范文库 - 历史记录数据管理

import type { ISentenceTemplate, IVocabularyItem } from './drill';

export interface IEssayRecord {
  /** 唯一 ID（时间戳） */
  id: string;
  /** 范文标题（从首句提取或 AI 生成） */
  title: string;
  /** 范文原文 */
  essay: string;
  /** 句式模板列表 */
  templates: ISentenceTemplate[];
  /** 全文生词汇总 */
  summaryVocab: IVocabularyItem[];
  /** 已过关的句子 ID */
  masteredSentenceIds: string[];
  /** 当前练习到的句子索引 */
  currentSentenceIndex: number;
  /** 是否已进入整篇套用阶段 */
  isFullEssayPhase: boolean;
  /** 保存时间（ISO 字符串） */
  savedAt: string;
}

const LIBRARY_KEY = '__app_essay_library_v1';

/**
 * 从范文中智能提取标题：取第一句前 30 个字符
 */
export function generateEssayTitle(essay: string, templates: ISentenceTemplate[]): string {
  const firstSentence =
    templates[0]?.originalSentence ||
    essay.split(/[.!?]/)[0]?.trim() ||
    '未命名范文';
  const clean = firstSentence.replace(/\s+/g, ' ').trim();
  if (clean.length <= 30) return clean;
  return clean.slice(0, 30) + '…';
}

/**
 * 读取所有范文记录
 */
export function loadEssayLibrary(): IEssayRecord[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.sort(
      (a: IEssayRecord, b: IEssayRecord) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * 保存/更新一篇范文记录（按 id 去重，同 id 更新进度）
 */
export function saveEssayRecord(record: IEssayRecord): void {
  try {
    const list = loadEssayLibrary();
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    // 最多保留 50 篇
    const trimmed = list.slice(0, 50);
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(trimmed));
  } catch {
    // 存储失败静默
  }
}

/**
 * 删除一篇范文记录
 */
export function deleteEssayRecord(id: string): void {
  try {
    const list = loadEssayLibrary();
    const next = list.filter((r) => r.id !== id);
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
