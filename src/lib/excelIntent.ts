import { correctTopicTypos } from './powerpointIntent';

export type ExcelDetectedIntent =
  | 'NORMAL_CHAT'
  | 'EXCEL_GENERATION'
  | 'EXCEL_MODIFICATION';

export interface ExcelIntentResult {
  intent: ExcelDetectedIntent;
  topic: string;
  wantsChart: boolean;
  chartType?: 'bar' | 'line' | 'pie' | 'column';
  modificationInstruction?: string;
}

export function extractExcelTopic(rawMessage: string): string {
  const corrected = correctTopicTypos(rawMessage);
  let cleaned = corrected
    .trim()
    // Strip prefixes from Excel card action dispatchers
    .replace(/^(\s*modify\s+spreadsheet\s*:\s*|\s*update\s+spreadsheet\s*:\s*|\s*spreadsheet\s*:\s*|\s*excel\s*:\s*)/i, '')
    // Strip conversational intros, complaints, reminders, and directives
    .replace(
      /^(see\s*,?\s*)?(i\s+(said|told|asked)\s+(him\s+|you\s+)?(to\s+)?|i\s+want\s+(him\s+|you\s+)?to\s+|i\s+want\s+|i\s+need\s+(him\s+|you\s+)?to\s+|i\s+need\s+)/i,
      ''
    )
    // Strip apologies, conversational fillers, and chat preambles
    .replace(
      /^(sorry\s*,?\s*|oops\s*,?\s*|i\s+meant\s+|no\s*,?\s*|actually\s*,?\s*|hey\s*,?\s*|hi\s*,?\s*|hello\s*,?\s*)/i,
      ''
    )
    // Strip conversational polite requests
    .replace(
      /^(please\s+|can\s+you\s+|could\s+you\s+|now\s+|just\s+|would\s+you\s+)/i,
      ''
    )
    // Strip creation verbs and prepositions like "make on", "make about", "make it on"
    .replace(
      /^(make\s+me\s+on|make\s+me\s+about|make\s+it\s+on|make\s+it\s+about|make\s+on|make\s+about|make\s+of|make\s+me|make|create\s+me|create\s+on|create\s+about|create\s+of|create|generate\s+on|generate|build\s+on|build|prepare|design|draft|give\s+me|show\s+me)\s+/i,
      ''
    )
    // Strip articles
    .replace(/^(a|an|the|my|some)\s+/i, '')
    // Strip Excel keywords
    .replace(
      /\b(microsoft\s+excel|excel\s+spreadsheet|excel\s+sheet|excel\s+workbook|excel\s+file|excel|xlsx|spreadsheet|spread\s+sheet|workbook|worksheet)\b/gi,
      ''
    )
    // Strip trailing or leading prepositions
    .replace(/^\s*(for\s+my|for|about|on|of|tracking|to\s+track|regarding|related\s+to|:|-)\s+/i, '')
    // Strip conversational trailing instructions
    .replace(/\s+(with\s+a\s+(bar\s+|line\s+|pie\s+|column\s+)?chart|with\s+charts?)$/i, '')
    .replace(/\s+(make\s+(it\s+)?clear\s+please|clear\s+please|please)$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[.?!]+$/, '')
    .trim();

  // If topic is "games" or "gaming", expand to "Video Games"
  if (/^(games?|gaming|video\s*games?|pc\s*games?|play\s*games?)$/i.test(cleaned)) {
    return 'Video Games & Gaming Industry Benchmark';
  }

  // If topic is religion, standardize to "World Religions & Demographics"
  if (/^(religions?|world\s+religions?|faiths?|theology)$/i.test(cleaned)) {
    return 'World Religions & Demographics';
  }

  if (!cleaned || cleaned.length < 2) {
    return corrected.trim().replace(/[.?!]+$/, '') || 'Data Records & Statistics';
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function detectExcelIntent(
  message: string,
  isExcelModeActive: boolean,
  hasExistingExcelInChat = false
): ExcelIntentResult {
  const corrected = correctTopicTypos(message.trim());
  const trimmed = corrected.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return { intent: 'NORMAL_CHAT', topic: '', wantsChart: false };
  }

  const wantsChart = /\b(chart|graph|bar\s+chart|line\s+chart|pie\s+chart|column\s+chart|plot)\b/i.test(lower);
  let chartType: 'bar' | 'line' | 'pie' | 'column' | undefined;
  if (/\bpie\s+chart\b/i.test(lower)) chartType = 'pie';
  else if (/\bline\s+chart\b/i.test(lower)) chartType = 'line';
  else if (/\bcolumn\s+chart\b/i.test(lower)) chartType = 'column';
  else if (wantsChart) chartType = 'bar';

  // 1. If Excel mode was explicitly toggled via "+ -> CREATE -> Excel Spreadsheet"
  if (isExcelModeActive) {
    return {
      intent: 'EXCEL_GENERATION',
      topic: extractExcelTopic(trimmed),
      wantsChart,
      chartType,
    };
  }

  // 2. Pure informational questions about Excel -> NORMAL_CHAT
  const hasCreationVerb =
    /\b(make|create|generate|build|prepare|design|draft|produce|give\s+me)\b/i.test(lower);

  const isPureQuestionAboutExcel =
    !hasCreationVerb &&
    /^(what\s+is|what\s+does|who\s+created|who\s+made|how\s+do\s+i|how\s+does|explain|define|tell\s+me\s+about)\s+(microsoft\s+)?(a\s+|an\s+)?(excel|xlsx|spreadsheet|vlookup|pivot\s+table)\b/i.test(
      lower
    );

  if (isPureQuestionAboutExcel) {
    return { intent: 'NORMAL_CHAT', topic: '', wantsChart: false };
  }

  // 3. Explicit prefix from Excel drawer or action handlers
  if (/^(\s*modify\s+spreadsheet\s*:|\s*update\s+spreadsheet\s*:)/i.test(lower)) {
    const cleanInstruction = trimmed.replace(/^(\s*modify\s+spreadsheet\s*:|\s*update\s+spreadsheet\s*:)\s*/i, '');
    return {
      intent: 'EXCEL_MODIFICATION',
      topic: cleanInstruction,
      wantsChart,
      chartType,
      modificationInstruction: cleanInstruction,
    };
  }

  if (/^(\s*spreadsheet\s*:|\s*excel\s*:)/i.test(lower)) {
    const cleanTopic = trimmed.replace(/^(\s*spreadsheet\s*:|\s*excel\s*:)\s*/i, '');
    return {
      intent: 'EXCEL_GENERATION',
      topic: extractExcelTopic(cleanTopic),
      wantsChart,
      chartType,
    };
  }

  // 4. Natural-language Excel modification when a workbook already exists in the current conversation
  if (hasExistingExcelInChat) {
    const isNewWorkbookRequest =
      /\b(make\s+another|create\s+another|new\s+excel|new\s+spreadsheet|new\s+workbook|another\s+excel|another\s+spreadsheet)\b/i.test(
        lower
      );

    if (!isNewWorkbookRequest) {
      const isExcelModification =
        /^(now\s+|please\s+|can\s+you\s+)?(add\s+a\s+total\s+column|add\s+a\s+[\w\s]+\s+column|create\s+another\s+sheet|add\s+(another|a\s+new|a\s+summary|a\s+dashboard|care\s+supplies|sacred\s+traditions|stock\s+summary|category\s+summary|detailed\s+summary|timeline|historical\s+eras?)\s+sheet|create\s+[\w\s]+\s+sheet|add\s+a\s+(bar\s+|line\s+|pie\s+|column\s+)?chart|change\s+(the\s+)?currency\s+to\s+\w+|add\s+formulas?|sort\s+by\s+[\w\s]+|highlight\s+[\w\s]+|rename\s+(the\s+)?sheet(\s+to\s+[\w\s]+)?|add\s+\d+\s*(more\s+)?[\w\s]+|add\s+more\s+rows?)\b/i.test(
          lower
        );

      if (isExcelModification) {
        return {
          intent: 'EXCEL_MODIFICATION',
          topic: trimmed,
          wantsChart,
          chartType,
          modificationInstruction: trimmed,
        };
      }

      // If user is inside an existing spreadsheet context and says "of Batman", "Batman", "Superman",
      // "of Superman", "now Batman", etc., treat it as a spreadsheet generation or subject switch:
      const isOfCharacterTopic = /^(of|on|about)\s+[a-z0-9\s_-]+$/i.test(trimmed);
      const isCharacterNameOnly = /^(batman|superman|spiderman|spider-man|iron\s*man|avengers|hulk|thor|wonder\s*woman|flash|aquaman|joker|wolverine|deadpool)$/i.test(trimmed);
      if (isOfCharacterTopic || isCharacterNameOnly) {
        return {
          intent: 'EXCEL_GENERATION',
          topic: extractExcelTopic(trimmed),
          wantsChart: true,
          chartType: 'bar',
        };
      }
    }
  }

  // 5. Natural-language Excel generation requests
  // Examples:
  // "make a spreadsheet on Superman"
  // "make a spreadsheet of Batman"
  // "make an Excel sheet on Superman"
  // "sheet on Superman"
  // "create a student marks sheet"
  const explicitExcelRegex =
    /\b(make|create|generate|build|prepare|design|draft|give\s+me)\b[\s\S]*?\b(excel\s+sheet|excel\s+spreadsheet|excel\s+workbook|excel\s+file|excel|xlsx|spreadsheet|spread\s+sheet|workbook|marks\s+sheet|marksheet|attendance\s+tracker|attendance\s+sheet|expense\s+tracker|expense\s+sheet|inventory\s+sheet|inventory\s+tracker|sales\s+sheet|budget\s+sheet|sheet)\b/i;

  const directExcelRegex =
    /^(excel\s+sheet|excel\s+spreadsheet|excel|xlsx|spreadsheet|spread\s+sheet|sheet|marks\s+sheet|attendance\s+tracker)\s+(for|about|on|of|:|-)\s+\S+/i;

  // Avoid matching PowerPoint requests
  const isPptRequest = /\b(powerpoint|pptx|ppt|slide\s+deck|slides|presentation)\b/i.test(lower);

  if (!isPptRequest && (explicitExcelRegex.test(lower) || directExcelRegex.test(lower))) {
    return {
      intent: 'EXCEL_GENERATION',
      topic: extractExcelTopic(trimmed),
      wantsChart,
      chartType,
    };
  }

  // 6. Direct "of <character/topic>" even if conversation is new
  if (/^of\s+(batman|superman|spiderman|spider-man|iron\s*man|avengers|hulk|thor|wonder\s*woman|flash|aquaman|joker|wolverine|deadpool)\b/i.test(trimmed)) {
    return {
      intent: 'EXCEL_GENERATION',
      topic: extractExcelTopic(trimmed),
      wantsChart: true,
      chartType: 'bar',
    };
  }

  return { intent: 'NORMAL_CHAT', topic: '', wantsChart: false };
}

