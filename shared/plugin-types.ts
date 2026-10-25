// ---- plugin:english_essay_sentence_template_extractor_1 ----
// ============================================================
// 插件 english_essay_sentence_template_extractor_1 (范文句式提取器) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export type EnglishEssaySentenceTemplateExtractorOneInput = {
  /** 待分析的英语范文全文内容 */
  english_essay_content: string;
};

/**
 * const input: EnglishEssaySentenceTemplateExtractorOneInput = { english_essay_content };
 * capabilityClient.load('english_essay_sentence_template_extractor_1').call<EnglishEssaySentenceTemplateExtractorOneOutput>('textToJson', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { sentenceTemplates, totalSentences, summaryVocabulary } = result;
 * 返回值形如：
 *   {"sentenceTemplates":[],"totalSentences":0,"summaryVocabulary":[]}
 */
export type EnglishEssaySentenceTemplateExtractorOneOutput = {
  /** 句子句式模板列表，每个元素为一个句子的分析结果，items schema: {id: string(句子唯一标识), originalSentence: string(原文句子), skeleton: string(句式骨架，空位用___表示), blanks: Array(空位信息列表，items schema: {id: string(空位唯一标识), index: Number(空位在句子中的位置索引), originalContent: string(空位原始内容), grammaticalRole: string(空位语法角色)}), vocabulary: Array(句子生词列表，items schema: {word: string(单词), pos: string(词性), meaning: string(中文释义)}), grammarTags: Array(语法点标签字符串数组)} */
  sentenceTemplates: unknown[];
  /** 范文总句子数量 */
  totalSentences: number;
  /** 全文汇总生词表，无重复，items schema: {word: string(单词), pos: string(词性), meaning: string(中文释义)} */
  summaryVocabulary: unknown[];
};
// ---- end:english_essay_sentence_template_extractor_1 ----

// ---- plugin:english_writing_topic_generator_2 ----
// ============================================================
// 插件 english_writing_topic_generator_2 (练习主题生成器) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export type EnglishWritingTopicGeneratorTwoInput = {
  /** 用于替换练习的句式骨架 */
  sentence_framework: string;
  /** 原参考主题 */
  original_topic: string;
};

/**
 * const input: EnglishWritingTopicGeneratorTwoInput = { sentence_framework, original_topic };
 * capabilityClient.load('english_writing_topic_generator_2').callStream<EnglishWritingTopicGeneratorTwoOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 EnglishWritingTopicGeneratorTwoOutput 一致，外面没有 data / choices / message 包装：
 *   {"content":"示例文本","response":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.content ?? ''; }
 */
export type EnglishWritingTopicGeneratorTwoOutput = {
  content: string;
  response?: string;
};
// ---- end:english_writing_topic_generator_2 ----

// ---- plugin:fill_in_blank_correction_assistant_3 ----
// ============================================================
// 插件 fill_in_blank_correction_assistant_3 (填空批改助手) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export type FillInBlankCorrectionAssistantThreeInput = {
  /** 带填空的原句子，填空部分请用下划线或括号标注 */
  original_sentence: string;
  /** 用户填写的答案内容 */
  user_answer: string;
  /** 额外的批改要求（可选，如特定语法点考察、难度等级等） */
  additional_requirements?: string;
};

/**
 * const input: FillInBlankCorrectionAssistantThreeInput = { original_sentence, user_answer, additional_requirements };
 * capabilityClient.load('fill_in_blank_correction_assistant_3').callStream<FillInBlankCorrectionAssistantThreeOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 FillInBlankCorrectionAssistantThreeOutput 一致，外面没有 data / choices / message 包装：
 *   {"response":"示例文本","content":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.response ?? ''; }
 */
export type FillInBlankCorrectionAssistantThreeOutput = {
  response?: string;
  content: string;
};
// ---- end:fill_in_blank_correction_assistant_3 ----

// ---- plugin:grammar_explanation_generator_4 ----
// ============================================================
// 插件 grammar_explanation_generator_4 (语法讲解生成器) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export type GrammarExplanationGeneratorFourInput = {
  /** 需要讲解语法的英语句子内容 */
  sentence_content: string;
};

/**
 * const input: GrammarExplanationGeneratorFourInput = { sentence_content };
 * capabilityClient.load('grammar_explanation_generator_4').callStream<GrammarExplanationGeneratorFourOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 GrammarExplanationGeneratorFourOutput 一致，外面没有 data / choices / message 包装：
 *   {"response":"示例文本","content":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.response ?? ''; }
 */
export type GrammarExplanationGeneratorFourOutput = {
  response?: string;
  content: string;
};
// ---- end:grammar_explanation_generator_4 ----

// ---- plugin:full_article_grading_polisher_5 ----
// ============================================================
// 插件 full_article_grading_polisher_5 (整篇批改润色器) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export type FullArticleGradingPolisherFiveInput = {
  /** 用户根据句式骨架套用新主题撰写的整篇原始文章内容 */
  original_article: string;
};

/**
 * const input: FullArticleGradingPolisherFiveInput = { original_article };
 * capabilityClient.load('full_article_grading_polisher_5').callStream<FullArticleGradingPolisherFiveOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 FullArticleGradingPolisherFiveOutput 一致，外面没有 data / choices / message 包装：
 *   {"content":"示例文本","response":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.content ?? ''; }
 */
export type FullArticleGradingPolisherFiveOutput = {
  content: string;
  response?: string;
};
// ---- end:full_article_grading_polisher_5 ----

// ---- plugin:word_definition_generator_6 ----
// ============================================================
// 插件 word_definition_generator_6 (单词释义生成器) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export type WordDefinitionGeneratorSixInput = {
  /** 需要查询释义的目标英文单词 */
  target_word: string;
  /** 目标单词所在的上下文句子 */
  context_sentence: string;
};

/**
 * const input: WordDefinitionGeneratorSixInput = { target_word, context_sentence };
 * capabilityClient.load('word_definition_generator_6').callStream<WordDefinitionGeneratorSixOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 WordDefinitionGeneratorSixOutput 一致，外面没有 data / choices / message 包装：
 *   {"content":"示例文本","response":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.content ?? ''; }
 */
export type WordDefinitionGeneratorSixOutput = {
  content: string;
  response?: string;
};
// ---- end:word_definition_generator_6 ----