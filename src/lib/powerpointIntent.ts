export type DetectedIntentType =
  | 'NORMAL_CHAT'
  | 'POWERPOINT_GENERATION'
  | 'POWERPOINT_MODIFICATION';

export interface PowerPointIntentResult {
  intent: DetectedIntentType;
  topic: string;
  slideCount: number;
  hasExplicitSlideCount: boolean;
  slideCountProvided: boolean;
  audience?: string;
  isPblProject: boolean;
  isContextualTurnIntoPpt: boolean;
  isTopicAmbiguous?: boolean;
  ambiguityClarificationQuestion?: string;
  modificationInstruction?: string;
}

const WORD_NUMBER_MAP: Record<string, number> = {
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

const TOPIC_TYPO_DICTIONARY: [RegExp, string][] = [
  [/\bequaility\b/gi, 'equality'],
  [/\bequailty\b/gi, 'equality'],
  [/\bequallity\b/gi, 'equality'],
  [/\beqality\b/gi, 'equality'],
  [/\bineqality\b/gi, 'inequality'],
  [/\binequalty\b/gi, 'inequality'],
  [/\binequallity\b/gi, 'inequality'],
  [/\benviromental\b/gi, 'environmental'],
  [/\benviornmental\b/gi, 'environmental'],
  [/\bpolution\b/gi, 'pollution'],
  [/\bpolluton\b/gi, 'pollution'],
  [/\bstudant(s)?\b/gi, 'student$1'],
  [/\battendence\b/gi, 'attendance'],
  [/\bpowerpoit\b/gi, 'PowerPoint'],
  [/\bpowerpiont\b/gi, 'PowerPoint'],
  [/\bpowepoint\b/gi, 'PowerPoint'],
  [/\bpowerponit\b/gi, 'PowerPoint'],
  [/\bpresentaion\b/gi, 'presentation'],
  [/\bpresentaton\b/gi, 'presentation'],
  [/\bslideshw\b/gi, 'slideshow'],
  [/\bphotosythesis\b/gi, 'photosynthesis'],
  [/\bphotosinthesis\b/gi, 'photosynthesis'],
  [/\bartifical\b/gi, 'artificial'],
  [/\binteligence\b/gi, 'intelligence'],
  [/\bindustrail\b/gi, 'industrial'],
  [/\brevoluton\b/gi, 'revolution'],
  [/\bgeograpy\b/gi, 'geography'],
  [/\bclimte\b/gi, 'climate'],
  [/\bchnage\b/gi, 'change'],
  [/\bonna\b/gi, 'on a'],
  [/\bna\s+cat\b/gi, 'a cat'],
  [/\bon\s+na\b/gi, 'on a'],
  [/\bdinosour(s)?\b/gi, 'dinosaur$1'],
  [/\bdinasour(s)?\b/gi, 'dinosaur$1'],
  [/\bdinasaur(s)?\b/gi, 'dinosaur$1'],
  [/\bexcell\b/gi, 'Excel'],
  [/\bexpences\b/gi, 'expenses'],
  [/\bfinancal\b/gi, 'financial'],
];

export function correctTopicTypos(input: string): string {
  let result = input;
  for (const [regex, replacement] of TOPIC_TYPO_DICTIONARY) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Parses a direct reply to "How many slides would you like to create?"
 * e.g. "5", "5 slides", "10", "8", "12 slides", "five", "make it 5", "exactly five slides"
 */
export function parseSlideCountReply(message: string): number | null {
  const trimmed = correctTopicTypos(message).trim().toLowerCase();
  if (!trimmed) return null;

  // Exact or simple numeric response e.g. "5", "10 slides", "make it 5", "exactly 8 slides", "12 please"
  const simpleNumMatch = trimmed.match(
    /^(?:make\s+it\s+|create\s+|generate\s+|exactly\s+|i\s+want\s+|i'd\s+like\s+|around\s+|about\s+|custom\s*:?\s*)?(\d{1,2})(?:\s*[-–]?\s*(?:ppt\s+)?slides?|\s*ppt)?(?:\s+please|\s+thanks|\s+thank\s+you)?[.!]?$/i
  );
  if (simpleNumMatch) {
    const n = parseInt(simpleNumMatch[1], 10);
    if (n >= 1 && n <= 25) return n;
  }

  // Word number response e.g. "one", "two", "five", "ten slides", "make it one"
  for (const [word, val] of Object.entries(WORD_NUMBER_MAP)) {
    const wordReplyRegex = new RegExp(
      `^(?:make\\s+it\\s+|create\\s+|exactly\\s+|i\\s+want\\s+|around\\s+)?${word}(?:\\s*[-–]?\\s*(?:ppt\\s+)?slides?|\\s*ppt)?(?:\\s+please)?[.!]?$`,
      'i'
    );
    if (wordReplyRegex.test(trimmed) && val >= 1 && val <= 25) {
      return val;
    }
  }

  return null;
}

/**
 * Natural-Language Slide Count Detection (Requirements 14, 15, 16, 17):
 * Detects:
 * - "1 slide", "one slide", "5 slides", "five slides", "5-slide", "five-slide"
 * - "make it one", "make it five", "make it 1"
 * - "exactly one slide", "exactly 1 slide"
 * - "presentation of one slide", "presentation of 1"
 * - "create 1 PPT slide", "create 1 PPT", "create 1 slide"
 * - "make a PPT with 1 slide"
 */
export function parseRequestedSlideCountInfo(
  message: string,
  defaultCount = 8
): { slideCount: number; hasExplicitSlideCount: boolean } {
  const lower = correctTopicTypos(message).toLowerCase();

  // 1. Numeric + optional PPT/presentation + slides: e.g. "1 slide", "5 slides", "5-slide", "create 1 PPT slide"
  const numericSlidesMatch = lower.match(
    /\b(?:exactly\s+)?(\d{1,2})\s*[-–]?\s*(?:powerpoint\s+|ppt\s+|pptx\s+|pbl\s+)?slides?\b/i
  );
  if (numericSlidesMatch) {
    const num = parseInt(numericSlidesMatch[1], 10);
    if (num >= 1 && num <= 25) {
      return { slideCount: num, hasExplicitSlideCount: true };
    }
  }

  // 2. Numeric with action/noun: e.g. "create 1 slide about...", "make it 1", "presentation of 1", "with 1 slide"
  const numericContextMatch = lower.match(
    /\b(?:make\s+it|exactly|presentation\s+of|ppt\s+of|deck\s+of|create|make|generate)\s+(\d{1,2})(?:\s+(?:ppt|pptx|powerpoint|pbl|slides?))?\b/i
  );
  if (numericContextMatch) {
    const num = parseInt(numericContextMatch[1], 10);
    if (num >= 1 && num <= 25) {
      return { slideCount: num, hasExplicitSlideCount: true };
    }
  }

  // 3. Word numbers: e.g. "one slide", "five slides", "make it one", "exactly one slide"
  for (const [word, val] of Object.entries(WORD_NUMBER_MAP)) {
    const wordSlideRegex = new RegExp(
      `\\b(?:(?:exactly\\s+)?${word}\\s*[-–]?\\s*(?:powerpoint\\s+|ppt\\s+|pptx\\s+|pbl\\s+)?slides?|(?:make\\s+it|exactly|presentation\\s+of|ppt\\s+of|with)\\s+${word})\\b`,
      'i'
    );
    if (wordSlideRegex.test(lower) && val >= 1 && val <= 25) {
      return { slideCount: val, hasExplicitSlideCount: true };
    }
  }

  return { slideCount: defaultCount, hasExplicitSlideCount: false };
}

export function parseRequestedSlideCount(message: string, defaultCount = 8): number {
  return parseRequestedSlideCountInfo(message, defaultCount).slideCount;
}

export function extractAudienceFromPrompt(message: string): string | undefined {
  const corrected = correctTopicTypos(message);
  const gradeMatch = corrected.match(
    /\b(grade\s+\d+|class\s+\d+|middle\s+school|high\s+school|elementary|university|college|beginners|kids|executives)\b/i
  );
  if (gradeMatch) {
    return gradeMatch[1].replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return undefined;
}

export interface PendingSlideCountPromptData {
  topic: string;
  userPrompt: string;
  isPblProject: boolean;
  audience?: string;
  isContextualTurnIntoPpt?: boolean;
}

const SLIDE_COUNT_PROMPT_REGEX = /<!--\s*sigma-ppt-slide-count-prompt:([\s\S]*?)-->/;

export function serializeSlideCountPrompt(data: PendingSlideCountPromptData): string {
  const encoded = encodeURIComponent(JSON.stringify(data));
  return `<!-- sigma-ppt-slide-count-prompt:${encoded} -->`;
}

export function serializeSlideCountPromptMessage(
  data: PendingSlideCountPromptData,
  customQuestionText?: string
): string {
  const encoded = encodeURIComponent(JSON.stringify(data));
  const question = customQuestionText || '**How many slides would you like to create?**';
  return `${question}\n\n<!-- sigma-ppt-slide-count-prompt:${encoded} -->`;
}

export function extractSlideCountPromptFromMessage(content: string): {
  promptData: PendingSlideCountPromptData | null;
  cleanText: string;
} {
  if (!content) return { promptData: null, cleanText: '' };
  const match = content.match(SLIDE_COUNT_PROMPT_REGEX);
  if (!match) {
    return { promptData: null, cleanText: content };
  }
  const cleanText = content.replace(SLIDE_COUNT_PROMPT_REGEX, '').trim();
  try {
    const decoded = decodeURIComponent(match[1].trim());
    const parsed = JSON.parse(decoded) as PendingSlideCountPromptData;
    return { promptData: parsed, cleanText };
  } catch {
    return { promptData: null, cleanText };
  }
}

export function extractPresentationTopic(message: string): string {
  const corrected = correctTopicTypos(message);

  let cleaned = corrected
    .trim()
    .replace(/^(please\s+|can\s+you\s+|could\s+you\s+|i\s+want\s+you\s+to\s+|i\s+need\s+you\s+to\s+|now\s+)/i, '')
    .replace(
      /^(make\s+me|make|create\s+me|create|generate|build|prepare|design|draft|produce|give\s+me|turn\s+that\s+explanation\s+into|turn\s+this\s+into|convert\s+this\s+into)\s+/i,
      ''
    )
    .replace(/^(a|an|the|some|my)\s+/i, '')
    .replace(/\b(?:exactly\s+|make\s+it\s+|with\s+|of\s+)?(\d{1,2})\s*[-–]?\s*(?:powerpoint\s+|ppt\s+|pptx\s+)?slides?\s*/gi, '')
    .replace(
      /\b(?:exactly\s+|make\s+it\s+|with\s+|of\s+)?(three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*[-–]?\s*(?:powerpoint\s+|ppt\s+|pptx\s+)?slides?\s*/gi,
      ''
    )
    .replace(/\bmake\s+it\s+(three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|\d{1,2})\b/gi, '')
    .replace(/\b(for\s+my\s+|for\s+)?(grade\s+\d+|class\s+\d+)\s*(project\s*)?/gi, '')
    .replace(
      /\b(mega\s+)?(school\s+presentation|school\s+project|powerpoint\s+slides|powerpoint\s+presentation|presentation\s+slides|slide\s+deck|slide\s+show|slideshow|powerpoint|pptx|ppt\s+slides|ppt|presentation|slides|deck)\b/gi,
      ''
    )
    .replace(/\b(project[\s-]*based\s+learning|pbl\s+project|pbl\s+presentation|pbl)\b/gi, '')
    .replace(/^\s*(?:with|of|explaining|about|on|for|regarding|covering|titled|:|-|=)\s+/i, '')
    .replace(/^\s*(?:a|an|the|some|my)\s+/i, '')
    .replace(/^\s*(?:with|of|explaining|about|on|for|regarding|covering|titled|:|-|=)\s+/i, '')
    .replace(/^\s*(?:a|an|the|some|my)\s+/i, '')
    .replace(/\s+(with\s+\d+\s+slides?|for\s+my\s+project|for\s+school|presentation|slideshow|slides)$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[.?!]+$/, '')
    .trim();

  if (!cleaned || cleaned.length < 2) {
    return '';
  }

  // Keep uppercase acronyms like MAN, LAN, WAN, PAN, SAN, CAN, OSI, CAD, AI, WWI, WWII, DNA, STEM, PBL intact
  if (
    /^(man|lan|wan|pan|san|can|osi|tcp\/ip|sql|dbms|cpu|ram|rom|http|https|dns|cad|ai|ww1|ww2|wwi|wwii|dna|rna|iot|vr|ar|gdp|un|nato|stem)$/i.test(
      cleaned
    )
  ) {
    return cleaned.toUpperCase();
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const KNOWN_STANDARD_ACRONYMS = new Set([
  'MAN',
  'LAN',
  'WAN',
  'PAN',
  'SAN',
  'CAN',
  'OSI',
  'TCP/IP',
  'SQL',
  'DBMS',
  'CPU',
  'RAM',
  'ROM',
  'HTTP',
  'HTTPS',
  'DNS',
  'CAD',
  'AI',
  'WW1',
  'WW2',
  'WWI',
  'WWII',
  'DNA',
  'RNA',
  'IOT',
  'VR',
  'AR',
  'GDP',
  'UN',
  'NATO',
  'STEM',
  'PBL',
  'HTML',
  'CSS',
  'API',
  'GPU',
  'VPN',
  'USB',
  'LED',
  'ATP',
  'PH',
  'UV',
  'AC',
  'DC',
  'EU',
  'UK',
  'US',
  'USA',
]);

/**
 * Checks if a requested presentation topic is genuinely missing or ambiguous (Requirement 13).
 * Note: Known curriculum acronyms like MAN (Metropolitan Area Network), LAN, WAN, CAD, AI, DNA
 * are NOT treated as ambiguous because their educational meaning is clear.
 */
export function checkTopicAmbiguity(
  topic: string,
  hasConversationContext: boolean
): { isAmbiguous: boolean; clarificationQuestion?: string } {
  const clean = topic.trim();

  if (!clean || /^(it|this|that|something|anything|stuff|topic|subject)$/i.test(clean)) {
    if (hasConversationContext) {
      return { isAmbiguous: false };
    }
    return {
      isAmbiguous: true,
      clarificationQuestion:
        'Could you please tell me what specific topic you would like the PowerPoint presentation to be about?',
    };
  }

  const upper = clean.toUpperCase();
  if (KNOWN_STANDARD_ACRONYMS.has(upper)) {
    return { isAmbiguous: false };
  }

  // If the user typed a 2-3 letter unknown all-caps acronym with no context
  const isUnknownShortAcronym =
    /^[A-Z]{2,3}$/.test(clean) &&
    !/^(BOY|MAN|CAT|DOG|SUN|SEA|WAR|ART|LAW|TAX|GAS|OIL|ICE|AIR|CAR|BUS|EYE|EAR|ARM|LEG|RED|SKY|TEA)$/i.test(
      upper
    );

  if (isUnknownShortAcronym && !hasConversationContext) {
    return {
      isAmbiguous: true,
      clarificationQuestion: `Could you please specify what you mean by **“${clean}”** so I can create accurate slides for your exact topic?`,
    };
  }

  return { isAmbiguous: false };
}

/**
 * Dedicated Intent Detector for Sigma AI PowerPoint vs. Normal Chat
 */
export function detectPowerPointIntent(
  message: string,
  isPowerPointModeActive: boolean,
  hasExistingPresentationInChat = false,
  hasPriorConversationContext = false
): PowerPointIntentResult {
  const corrected = correctTopicTypos(message.trim());
  const trimmed = corrected.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return {
      intent: 'NORMAL_CHAT',
      topic: '',
      slideCount: 8,
      hasExplicitSlideCount: false,
      slideCountProvided: false,
      isPblProject: false,
      isContextualTurnIntoPpt: false,
    };
  }

  const isPblProject = /\b(pbl|project[\s-]*based\s+learning)\b/i.test(lower);
  const audience = extractAudienceFromPrompt(trimmed);

  // 1. Check if user is asking for an explanation ABOUT a specific slide (e.g., "Now explain slide 4", "What is on slide 3?")
  const isExplainSlideQuery =
    /^(now\s+)?(explain|what\s+is\s+on|summarize|tell\s+me\s+about|read|describe|elaborate\s+on)\s+slide\s+\d+\b/i.test(
      lower
    );
  if (isExplainSlideQuery && !isPowerPointModeActive) {
    return {
      intent: 'NORMAL_CHAT',
      topic: '',
      slideCount: 8,
      hasExplicitSlideCount: false,
      slideCountProvided: false,
      isPblProject: false,
      isContextualTurnIntoPpt: false,
    };
  }

  // 2. Check for "Make that slide" / "Make those slides" / "Turn that into a PowerPoint" (Requirement 18)
  const isMakeThatSlidePhrase =
    /^(?:now\s+|please\s+|can\s+you\s+)?(?:make|create|generate|build|turn)\s+(?:that|those|this|it|the\s+above)\s*(?:into\s+)?(?:a\s+)?(?:powerpoint|ppt|pptx|presentation|slides?|slide\s+deck)?[.!]?$/i.test(
      lower
    ) && /\b(slide|slides|ppt|pptx|powerpoint|presentation)\b/i.test(lower);

  if (isMakeThatSlidePhrase && (hasPriorConversationContext || hasExistingPresentationInChat)) {
    const { slideCount, hasExplicitSlideCount } = parseRequestedSlideCountInfo(trimmed, 5);
    return {
      intent: 'POWERPOINT_GENERATION',
      topic: '',
      slideCount,
      hasExplicitSlideCount,
      slideCountProvided: true, // Requirement 18: Use existing context, do not unnecessarily ask "How many slides?"
      audience,
      isPblProject,
      isContextualTurnIntoPpt: true,
    };
  }

  // 3. If PowerPoint Mode was explicitly toggled via the "+" menu
  if (isPowerPointModeActive) {
    const { slideCount, hasExplicitSlideCount } = parseRequestedSlideCountInfo(trimmed, 8);
    const topic = extractPresentationTopic(trimmed) || trimmed;
    const isContextual = /\b(that\s+explanation|this\s+topic|previous\s+answer|above|that\s+slide)\b/i.test(lower);
    const ambiguity = checkTopicAmbiguity(topic, hasPriorConversationContext || isContextual);
    return {
      intent: 'POWERPOINT_GENERATION',
      topic,
      slideCount,
      hasExplicitSlideCount,
      slideCountProvided: hasExplicitSlideCount || isContextual,
      audience,
      isPblProject,
      isContextualTurnIntoPpt: isContextual,
      isTopicAmbiguous: ambiguity.isAmbiguous,
      ambiguityClarificationQuestion: ambiguity.clarificationQuestion,
    };
  }

  // 4. Check if user is asking a purely informational question ABOUT PowerPoint / PPTX itself
  const hasCreationActionVerb =
    /\b(make|create|generate|build|design|prepare|draft|produce|turn\s+.*\s+into|convert\s+.*\s+into|give\s+me)\b/i.test(
      lower
    );

  const isPureDefinitionAboutPpt =
    !hasCreationActionVerb &&
    /^(tell\s+me\s+what|what\s+is|what\s+does|what\s+are|who\s+invented|who\s+created|who\s+made|how\s+does|define|meaning\s+of)\s+(microsoft\s+)?(a\s+)?(powerpoint|pptx|ppt|slide\s+deck)\b/i.test(
      lower
    );

  if (isPureDefinitionAboutPpt) {
    return {
      intent: 'NORMAL_CHAT',
      topic: '',
      slideCount: 8,
      hasExplicitSlideCount: false,
      slideCountProvided: false,
      isPblProject: false,
      isContextualTurnIntoPpt: false,
    };
  }

  // 5. Check for Modification Intent when a presentation already exists in the current conversation
  if (hasExistingPresentationInChat) {
    const isNewPresentationRequest =
      /\b(create\s+another|make\s+another|new\s+powerpoint|new\s+presentation|new\s+pptx|another\s+pptx|another\s+powerpoint|another\s+presentation)\b/i.test(
        lower
      );

    if (!isNewPresentationRequest) {
      const isModificationCommand =
        /^(now\s+|please\s+|can\s+you\s+)?(change\s+the\s+(colors?|theme|title|layout|style|background|design|structure)|make\s+(it|the\s+powerpoint|the\s+presentation|the\s+slides?)\s+(more\s+colorful|more\s+visual|more\s+academic|more\s+creative|darker|lighter|simpler|shorter|longer|better|more\s+detailed|different|suitable\s+for\s+[\w\s]+)|make\s+slide\s+\d+\s+[\w\s]+|add\s+(one|two|three|four|five|\d+|more)\s+slides?|add\s+more\s+(pictures|images|visuals|charts|diagrams|cards)|use\s+a\s+(dark|light|colorful|purple|blue|navy|emerald|sunset|modern|different|editorial|blueprint|scientific|documentary)\s+(theme|palette|color|background|style)|regenerate(\s+the\s+(presentation|powerpoint|slides))?|different\s+(design|structure|style))\b/i.test(
          lower
        );

      if (isModificationCommand) {
        const { slideCount, hasExplicitSlideCount } = parseRequestedSlideCountInfo(trimmed, 8);
        return {
          intent: 'POWERPOINT_MODIFICATION',
          topic: trimmed,
          slideCount,
          hasExplicitSlideCount,
          slideCountProvided: hasExplicitSlideCount,
          audience,
          isPblProject,
          isContextualTurnIntoPpt: false,
          modificationInstruction: trimmed,
        };
      }
    }
  }

  // 6. Check for Natural-Language PowerPoint Generation Requests
  const actionPlusPptRegex =
    /\b(make|create|generate|build|design|prepare|draft|produce|turn\s+[\w\s]+\s+into|convert\s+[\w\s]+\s+into|give\s+me)\b[\s\S]*?\b(powerpoint|pptx|ppt|mega\s+ppt|mega\s+pptx|mega\s+slides|presentation|slide\s+deck|slideshow|slide\s+show|school\s+project|project[\s-]*based\s+learning|slides|deck|pbl|\d+\s*[-–]?\s*slides?)\b/i;

  const directPptTopicRegex =
    /^(mega\s+ppt|mega\s+pptx|powerpoint|pptx|ppt|presentation|slideshow|slide\s+show|school\s+project|slide\s+deck|pbl(\s+on|\s+about|\s+project)?|\d+\s*[-–]?\s*slide\s+presentation)\s+(about|on|for|explaining|covering|regarding|of|with|:|-)\s+\S+/i;

  // Exclude Excel requests from accidentally triggering PowerPoint
  const isExcelExplicit =
    /\b(excel|xlsx|spreadsheet|workbook|worksheet|marks\s+sheet|expense\s+sheet|attendance\s+tracker)\b/i.test(
      lower
    );

  if (!isExcelExplicit && (actionPlusPptRegex.test(lower) || directPptTopicRegex.test(lower))) {
    const { slideCount, hasExplicitSlideCount } = parseRequestedSlideCountInfo(trimmed, 8);
    const topic = extractPresentationTopic(trimmed);
    const isContextual =
      /\b(turn\s+that(\s+explanation)?\s+into|turn\s+this\s+into|from\s+that\s+explanation|based\s+on\s+that|make\s+that\s+slide)\b/i.test(
        lower
      );
    const ambiguity = checkTopicAmbiguity(topic, hasPriorConversationContext || isContextual);

    return {
      intent: 'POWERPOINT_GENERATION',
      topic: topic || '',
      slideCount,
      hasExplicitSlideCount,
      slideCountProvided: hasExplicitSlideCount || isContextual,
      audience,
      isPblProject,
      isContextualTurnIntoPpt: isContextual,
      isTopicAmbiguous: ambiguity.isAmbiguous,
      ambiguityClarificationQuestion: ambiguity.clarificationQuestion,
    };
  }

  return {
    intent: 'NORMAL_CHAT',
    topic: '',
    slideCount: 8,
    hasExplicitSlideCount: false,
    slideCountProvided: false,
    isPblProject: false,
    isContextualTurnIntoPpt: false,
  };
}
