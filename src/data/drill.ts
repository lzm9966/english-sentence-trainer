// EXPORTS: ISentenceTemplate, IBlankInfo, IVocabularyItem, IDrillProgress, IThemePractice
// 句式练习应用 - 数据类型定义

export interface IBlankInfo {
  id: string;
  /** 空位在句子中的序号位置 */
  index: number;
  /** 原文中该位置的内容 */
  originalContent: string;
  /** 语法角色，如 "主语" "宾语" "状语" "定语从句" */
  grammaticalRole?: string;
}

export interface IVocabularyItem {
  word: string;
  /** 词性，如 n./v./adj./adv. */
  pos: string;
  /** 中文释义 */
  meaning: string;
}

export interface ISentenceTemplate {
  id: string;
  /** 原文句子 */
  originalSentence: string;
  /** 句式骨架，空位用 ___ 表示 */
  skeleton: string;
  /** 空位信息数组，按出现顺序 */
  blanks: IBlankInfo[];
  /** 本句生词及释义 */
  vocabulary: IVocabularyItem[];
  /** 语法点标签 */
  grammarTags: string[];
}

export interface IDrillProgress {
  /** 当前练习到第几句（索引，从 0 开始） */
  currentSentenceIndex: number;
  /** 已过关的句子 ID 集合 */
  masteredSentenceIds: string[];
  /** 当前句式下正在练习的主题索引 */
  currentThemeIndex: number;
  /** 是否已进入整篇套用阶段 */
  isFullEssayPhase: boolean;
}

export interface IThemePractice {
  /** 主题名称 */
  themeName: string;
  /** 主题描述 */
  themeDescription: string;
  /** 用户在各空位的填写答案（按 blanks 顺序） */
  answers: string[];
  /** 是否已经提交并批改过 */
  submitted: boolean;
  /** 批改结果 markdown */
  correctionResult: string;
}
