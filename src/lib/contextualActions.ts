import { LibraryContentType } from './libraryStorage';

export const analyzeAmbiguousShortInput = buildAmbiguityAndTypoDirective;

export interface AmbiguityHint {
  isAmbiguous: boolean;
  directive: string;
}

/**
 * Feature 9: Ambiguous Words, Names, Acronyms, and Unclear Short Inputs
 * Detects inputs like "Tom", "What is Tom?", "WASDY", "ho", or unfamiliar all-caps tokens
 * so the AI never confidently invents a single meaning.
 */
export function buildAmbiguityAndTypoDirective(
  userPrompt: string,
  hinglishEstablished = false
): AmbiguityHint {
  const trimmed = (userPrompt || '').trim();
  const clean = trimmed.replace(/[?!.,;:"'`]/g, '').trim();
  const lower = clean.toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);

  if (!clean) {
    return { isAmbiguous: false, directive: '' };
  }

  const langHint = hinglishEstablished
    ? 'Since the user communicates in Hinglish/Roman Urdu, phrase your response or clarification naturally in conversational Hinglish if appropriate.'
    : 'Phrase your response naturally and concisely in clear English (or match the user’s active language).';

  // Case 0a: User says "no [word]" or "no that word" / "no what is [word]" to clarify the meaning they want
  const noWordMatch = lower.match(/^no(?:\s+no)*\s+(?:i\s+mean\s+|what\s+is\s+|tell\s+me\s+|the\s+meaning\s+of\s+)?(.+)$/i);
  if (noWordMatch && words.length <= 7) {
    const targetAfterNo = noWordMatch[1].trim();
    return {
      isAmbiguous: true,
      directive: `CRITICAL "NO + WORD" CORRECTION & MULTI-MEANING PROTOCOL:
The user said "${trimmed}" because the previous explanation did not connect to the meaning they had in mind.
1. Focus strictly on what the user is trying to understand ("${targetAfterNo}" — or if they said "that word", the word/number from the previous user message).
2. NEVER say "let's move on", NEVER say "Sigma boy", and NEVER list what you can do (when offering help, only ever say "What can I help you with today?").
3. Define ALL multiple meanings of that word/number/term (everyday meaning, slang/street meaning, pop-culture/internet meaning, and technical meaning) using a dot (• ) before each point and TWO ENTERS (a blank line) between every point.
4. If the word/number has a sexual or adult slang meaning (such as "69" meaning a sexual position / sex pose), state clearly first: "I can't help with explicit adult content or tell you how to do, open, or see it, but I can tell you what the word means:" and then define all its meanings (including the sexual position / slang meaning) objectively in dot points (• ) separated by two enters.`,
    };
  }

  // Case 0b: User asks about "69" (or "what is 69", "meaning of 69", "tell me what is 69")
  if (/^(?:what\s+is\s+|meaning\s+of\s+|define\s+|tell\s+me\s+(?:what\s+is\s+)?|explain\s+)?69$/i.test(lower)) {
    return {
      isAmbiguous: true,
      directive: `CRITICAL ADULT/SLANG DEFINITION PROTOCOL FOR "69":
The user is asking about "69".
1. Start with this exact safe boundary: "I can't help with explicit adult content or tell you how to do, open, or see it, but I can tell you what **69** means:"
2. Then define ALL meanings of "69" in clear dot points (• ) with TWO ENTERS (a blank line) between each point:

• **Sexual Slang Meaning (Sex Pose):** "69" is a widely known slang term for a sexual position (sex pose) where two partners align their bodies in opposite directions.

• **Why It Is Called "69":** The digits "6" and "9" are upside-down mirror images of each other, visually representing two people facing opposite directions.

• **Internet & Meme Culture:** Online and in pop culture, people often say "Nice" as a humorous slang reaction whenever the number 69 appears.

• **Mathematical Meaning:** In math, 69 is the natural whole number after 68 and before 70 (equal to 3 × 23).`,
    };
  }

  // Case 1: "ho"
  if (lower === 'ho') {
    return {
      isAmbiguous: true,
      directive: `AMBIGUOUS SHORT INPUT ("ho"):
The user sent "ho". This may mean "hi"/"hello", a quick typo, or an incomplete message.
- Respond naturally as a short, friendly greeting or lightly ask what they meant in 1 short line (e.g. "Hey! 👋 What's up?" or "Hey! Did you mean 'hi', or were you about to ask something?").
- Do NOT confidently invent a technical definition for "ho".
- ${langHint}`,
    };
  }

  // Case 2: "Tom" or "What is Tom?" / "Who is Tom?"
  if (
    lower === 'tom' ||
    /^(what|who)\s+is\s+tom$/i.test(lower)
  ) {
    return {
      isAmbiguous: true,
      directive: `AMBIGUOUS MULTI-MEANING TERM ("${trimmed}"):
"Tom" can refer to several different things:
1. A common masculine given name (short for Thomas).
2. Famous fictional characters (such as Tom from *Tom and Jerry*, Tom Sawyer, or Talking Tom).
3. A male cat (a "tomcat") or male turkey.
4. A tom-tom drum in a drum kit, or acronyms like TOM (Target Operating Model).
- Briefly mention the main possibilities in a clear, friendly way and ask which "Tom" the user has in mind.
- Do NOT automatically assume only one single meaning.
- ${langHint}`,
    };
  }

  // Case 3: Single word that looks like an unrecognized acronym, keyboard mash/typo (e.g. "WASDY"), or ambiguous proper noun
  const knownClearSingleWords = new Set([
    'hi', 'hello', 'hey', 'yo', 'sup', 'hola', 'salam', 'salaam', 'namaste',
    'thanks', 'thank', 'ok', 'okay', 'yes', 'no', 'why', 'how', 'what', 'who',
    'help', 'code', 'story', 'summarize', 'explain', 'continue', 'more', 'next',
    'haan', 'acha', 'theek', 'bolo', 'bhai', 'bye', 'goodbye',
  ]);

  if (words.length === 1 && !knownClearSingleWords.has(lower)) {
    const token = words[0];
    const isAllCapsUnknown = /^[A-Z]{4,8}$/.test(token) && !/^(HTML|JSON|HTTP|HTTPS|NASA|FIFA|UEFA|NATO|SQL|REST|API|CSS|CPU|GPU|RAM|ROM|BIOS|OLED|WIFI|USB|PDF|XLSX|PPTX)$/.test(token);
    const isWasdyLike = /^wasd[a-z]$/i.test(token);

    if (isWasdyLike || isAllCapsUnknown) {
      return {
        isAmbiguous: true,
        directive: `AMBIGUOUS OR UNRECOGNIZED TOKEN ("${token}"):
The user typed "${token}".
- Do NOT confidently invent a fake definition or pretend "${token}" is a standard dictionary word.
- Politely note that "${token}" might be:
  • a typo (for example, ${isWasdyLike ? 'the **WASD** movement keys on a keyboard with an extra letter' : 'a nearby word or acronym'}),
  • an abbreviation / short form, or
  • a specific name or username.
- Ask a brief, natural clarification question to confirm what they meant.
- ${langHint}`,
      };
    }

    // Single capitalized proper name or ambiguous single noun
    if (/^[A-Z][a-z]{1,12}$/.test(token) && token.length <= 8) {
      return {
        isAmbiguous: true,
        directive: `SINGLE-WORD AMBIGUOUS INPUT ("${token}"):
The user sent the single word "${token}" without additional context.
- Since "${token}" can have multiple meanings (such as a name, a concept, a place, or a character), briefly mention the most likely possibilities or ask what specifically they would like to know about "${token}".
- Do NOT over-assume a single narrow meaning.
- ${langHint}`,
      };
    }
  }

  // Case 4: "What is [unknown/ambiguous short token]?"
  const whatIsMatch = clean.match(/^(?:what|who)\s+is\s+([A-Za-z]{2,8})$/i);
  if (whatIsMatch) {
    const target = whatIsMatch[1];
    if (/^wasd[a-z]$/i.test(target) || (/^[A-Z]{4,8}$/.test(target) && !/^(HTML|JSON|HTTP|HTTPS|NASA|FIFA|UEFA|NATO|SQL|REST|API|CSS|CPU|GPU|RAM|ROM|BIOS|OLED|WIFI|USB|PDF|XLSX|PPTX)$/.test(target))) {
      return {
        isAmbiguous: true,
        directive: `UNCLEAR TERM OR POSSIBLE TYPO ("${trimmed}"):
- Do NOT invent a definition for "${target}".
- Briefly mention whether it might be a typo, an acronym/short form, or a specific name, and ask the user to clarify what they meant.
- ${langHint}`,
      };
    }
  }

  return { isAmbiguous: false, directive: '' };
}

/**
 * Features 11 & 12 + Sections 6, 7, 19: Dynamic Context-Aware Follow-Up Actions
 * Generates task-specific, non-generic follow-up actions tailored to the user's request,
 * the assistant's response, the content type, programming language, and task domain.
 */
export function generateContextualFollowUpActions(
  responseContent: string,
  existingActions: string[] = [],
  userPrompt = ''
): string[] {
  const raw = (responseContent || '').trim();
  if (!raw) return [];

  const genericBannedPattern =
    /^(add a stronger ending twist|show (i am |ayaan['’]s )?feelings? more clearly|optimize input validation|add generic error handling|add error handling|add input validation|explain the code|optimize it|simplify it|give a real[- ]world example|give an example|summarize key points|summarize it)$/i;

  // Filter out legacy static story buttons and generic filler
  const cleanedExisting = existingActions
    .map((a) => a.trim())
    .filter((a) => a.length > 0 && !genericBannedPattern.test(a));

  if (cleanedExisting.includes('Sign in with Google')) {
    return cleanedExisting;
  }

  // Only generate follow-up action buttons for Library Materials (Code, Story, Essay, Article, Document, Prompt, Summary, Presentation, Spreadsheet)
  const artifactCheck = classifyResponseArtifact(raw, raw, { userPrompt });
  if (!artifactCheck.isArtifact) {
    return [];
  }

  // If the AI already generated 2-4 valid task-specific actions via ↳ lines for this Library Material, use them!
  if (cleanedExisting.length >= 2 && cleanedExisting.length <= 4) {
    return cleanedExisting.slice(0, 4);
  }

  const combinedLower = `${userPrompt || ''}\n${raw}`.toLowerCase();
  const lower = raw.toLowerCase();

  // 1. SPREADSHEET / EXCEL
  if (raw.includes('sigma-excel') || /\b(excel workbook|worksheet|=sum\(|=average\(|spreadsheet)\b/i.test(lower)) {
    return ['Create a chart', 'Summarize the data', 'Add monthly projections', 'Create an expense log'];
  }

  // 2. POWERPOINT / PRESENTATION
  if (raw.includes('sigma-powerpoint') || /\b(slide\s*\d|powerpoint|presentation deck)\b/i.test(combinedLower)) {
    return ['Add more slides', 'Improve slide structure', 'Add speaker notes', 'Add visual layout ideas'];
  }

  // 3. BUILDING / CONSTRUCTION / SANDBOX / VOXEL GAME (Section 6 & 7)
  if (
    /\b(building\s+game|voxel|minecraft|block\s+placement|grid\s+system|construction\s+game|place\s+blocks|sandbox\s+game|city\s+builder|terrain\s+builder)\b/i.test(
      combinedLower
    )
  ) {
    return [
      'Make it more 3D',
      'Make the building system more realistic',
      'Add terrain & grid snapping',
      'Add object placement & rotation',
    ];
  }

  // 4. GENERAL GAME DEVELOPMENT (2D / 3D / Pygame / Canvas / Three.js / Arcade)
  if (
    /\b(pygame|game\s+loop|player\s+movement|enemy|score|platformer|shooter|racing\s+game|arcade\s+game|three\.js|phaser|unity|godot|make\s+a\s+game|code\s+for\s+a\s+.*game)\b/i.test(
      combinedLower
    )
  ) {
    return [
      'Improve graphics & lighting',
      'Add 3D environment',
      'Add enemies & levels',
      'Add scoring & controls',
    ];
  }

  // 5. CODE / PROGRAMMING (Context-aware by domain instead of static generic filler)
  const hasCodeBlock =
    /```[a-zA-Z0-9_-]*\n[\s\S]{25,}/.test(raw) ||
    /\b(function\s+\w+|const\s+\w+\s*=|def\s+\w+\(|import\s+[\w{]+|class\s+\w+)\b/.test(raw);

  if (hasCodeBlock) {
    if (/\b(calculator|converter|timer|stopwatch|todo|task|weather|chat|dashboard|form|login)\b/i.test(combinedLower)) {
      return [
        'Convert it to a full GUI',
        'Add keyboard shortcuts',
        'Add history & save/load',
        'Improve visual styling',
      ];
    }
    if (/\b(website|landing\s+page|html|css|react|tailwind|navbar|portfolio|ui|frontend)\b/i.test(combinedLower)) {
      return [
        'Add smooth animations',
        'Make it mobile responsive',
        'Add interactive sections',
        'Add dark/light mode toggle',
      ];
    }
    if (/\b(api|database|sql|server|backend|auth|express|flask|django|fastapi)\b/i.test(combinedLower)) {
      return [
        'Add authentication middleware',
        'Add database persistence',
        'Add pagination & filtering',
        'Create frontend client for this API',
      ];
    }
    if (/\b(python|script|automation|bot|scraper|data|pandas|numpy)\b/i.test(combinedLower)) {
      return [
        'Convert it to a GUI app',
        'Add save/load to file',
        'Add interactive CLI menu',
        'Extend with advanced features',
      ];
    }
    return [
      'Add the next logical feature',
      'Convert the interface to a GUI',
      'Add save/load functionality',
      'Make it more interactive',
    ];
  }

  // 6. IMAGE PROMPT / VISUAL ARTWORK
  if (
    artifactCheck.artifactType === 'Prompt' ||
    /\b(ultra-detailed,\s*cinematic|visual\s+style:|camera:\s*cinematic|image\s+prompt)\b/i.test(lower)
  ) {
    return [
      'Make lighting more dramatic',
      'Switch to cyberpunk aesthetic',
      'Add 85mm portrait lens details',
      'Create a dark fantasy variation',
    ];
  }

  // 7. QUOTES / QUOTATIONS
  if (
    artifactCheck.artifactType === 'Quote' ||
    /\b(quotes?|quotations?|inspirational\s+quotes?)\b/i.test(combinedLower)
  ) {
    return [
      'Add more quotes',
      'Explain the meaning of each quote',
      'Include modern thinkers',
      'Focus on perseverance',
    ];
  }

  // 8. STORY / CREATIVE WRITING
  if (
    artifactCheck.artifactType === 'Story' ||
    /\b(once upon a time|whispered|footsteps|protagonist|chapter\s+\d|in a quiet village|under the moonlight|he realized|she realized|the old man|shadows)\b/i.test(lower)
  ) {
    return ['Make it longer', 'Add more dialogue', 'Create a different ending', 'Deepen the suspense'];
  }

  // 8. ESSAY / LONG-FORM ARTICLE / DOCUMENT / SUMMARY (Section 7)
  if (
    artifactCheck.artifactType === 'Essay' ||
    artifactCheck.artifactType === 'Article' ||
    artifactCheck.artifactType === 'Document' ||
    artifactCheck.artifactType === 'Summary'
  ) {
    return [
      'Make it shorter',
      'Make it more formal',
      'Add real-world examples',
      'Improve the introduction',
      'Simplify the language',
    ];
  }

  return [];
}

export interface ArtifactClassification {
  isArtifact: boolean;
  artifactTitle: string;
  artifactType: LibraryContentType;
}

/**
 * Features 14 & 15: Artifact Container vs Normal Chat Message Classification
 * Determines if an assistant response is a reusable Library-worthy artifact
 * (Code, Story, Essay, Article/Document, Prompt, Summary, Spreadsheet, Presentation)
 * versus a normal conversational answer. Supports both streaming and completed messages.
 */
export function classifyResponseArtifact(
  rawContent: string,
  displayMarkdown: string,
  options?: {
    hasPresentation?: boolean;
    presentationTitle?: string;
    hasExcel?: boolean;
    excelTitle?: string;
    hasPromptCard?: boolean;
    fullContent?: string;
    userPrompt?: string;
  }
): ArtifactClassification {
  const sourceText = (options?.fullContent || displayMarkdown || rawContent || '').trim();
  const text = (displayMarkdown || rawContent || '').trim();
  const lower = sourceText.toLowerCase();
  const promptLower = (options?.userPrompt || '').toLowerCase().trim();

  // Extract a clean title from the first Markdown heading or first meaningful line
  const extractTitle = (fallback: string): string => {
    const headingMatch = sourceText.match(/^#{1,3}\s+(.+)$/m) || text.match(/^#{1,3}\s+(.+)$/m);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].replace(/[*_`#]/g, '').trim().slice(0, 64);
    }
    const firstLine = (sourceText || text)
      .replace(/```[\s\S]*?```/g, '')
      .replace(/```[\s\S]*$/g, '')
      .replace(/[#*_`>]/g, '')
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 3);
    return (firstLine || fallback).slice(0, 60);
  };

  // STRICT RULE 1: Word Meanings and definitions NEVER qualify as artifacts / NEVER have "Add to Library"!
  const isWordMeaningQuery =
    /\b(meaning\s+of|word\s+meaning|define\b|definition\s+of|what\s+does\s+.*mean|vocabulary|synonym|antonym|kya\s+matlab|matlab\s+kya|lafz\s+ka\s+matlab|shabd\s+ka\s+arth)\b/i.test(
      promptLower
    ) ||
    /^(#+\s*)?(meaning\s+of|word\s+meaning|definition\s+of)\b/im.test(sourceText) ||
    /\b(definition:|part\s+of\s+speech:|word\s+meaning:)\b/i.test(sourceText);

  if (isWordMeaningQuery) {
    return {
      isArtifact: false,
      artifactTitle: '',
      artifactType: 'Document',
    };
  }

  // 1. PRESENTATION
  if (options?.hasPresentation || sourceText.includes('sigma-powerpoint') || /```sigma-powerpoint/i.test(sourceText)) {
    return {
      isArtifact: true,
      artifactTitle: options?.presentationTitle || extractTitle('PowerPoint Presentation'),
      artifactType: 'Presentation',
    };
  }

  // 2. SPREADSHEET
  if (options?.hasExcel || sourceText.includes('sigma-excel') || /```sigma-excel/i.test(sourceText)) {
    return {
      isArtifact: true,
      artifactTitle: options?.excelTitle || extractTitle('Excel Spreadsheet'),
      artifactType: 'Spreadsheet',
    };
  }

  // 3. PROMPT (Image Generation Prompt, Midjourney/DALL-E Prompt, System Prompt, Prompt Template)
  const isImagePrompt =
    options?.hasPromptCard ||
    /\b(Create an ultra-detailed, cinematic, professional-quality image of|Visual style: premium cinematic realism)\b/i.test(
      sourceText
    );
  const isPromptRequest =
    (/\b(write|give|create|generate|make)\s+(a\s+|an\s+|me\s+a\s+)?(prompt|image\s+prompt|midjourney\s+prompt|dall-?e\s+prompt|system\s+prompt|prompt\s+for)\b/i.test(
      promptLower
    ) ||
      /\bprompt\s+template\b/i.test(promptLower)) &&
    sourceText.length >= 100;

  if (isImagePrompt || isPromptRequest) {
    return {
      isArtifact: true,
      artifactTitle: 'AI Image Generation Prompt',
      artifactType: 'Prompt',
    };
  }

  // 4. STORY (Creative writing, fictional stories, narrative tales)
  const isStory =
    (sourceText.length >= 220 &&
      (/\b(once upon a time|chapter\s+\d|part\s*1\s*[:\-].*part\s*2\s*[:\-]|the moral of the story|short story)\b/i.test(
        lower
      ) ||
        (/["“][^"”]{12,}["”]/.test(sourceText) &&
          /\b(character|forest|whispered|journey|adventure|smiled|cried)\b/i.test(lower)))) ||
    (/\b(write\s+a\s+.*story|tell\s+me\s+a\s+.*story|kahani|story\s+about|narrate\s+a\s+story)\b/i.test(
      promptLower
    ) &&
      sourceText.length >= 180);

  if (isStory) {
    return {
      isArtifact: true,
      artifactTitle: extractTitle('Creative Story'),
      artifactType: 'Story',
    };
  }

  // 5. QUOTES (Famous quotes, inspirational quotations with attribution)
  const isQuoteRequest =
    /\b(quotes?|quotations?|sayings?|inspirational\s+quotes?|motivational\s+quotes?|famous\s+quotes?|quote\s+collection)\b/i.test(
      promptLower
    );
  const hasQuoteAttributions =
    (/(?:["“][^"”]{8,}["”]\s*[-—–]\s*[A-Z][a-zA-Z\s.]+)/.test(sourceText) &&
      sourceText.length >= 70) ||
    ((sourceText.match(/^>\s*["“].+["”]/gm) || []).length >= 2) ||
    ((sourceText.match(/^[•*-]\s*["“].+["”]/gm) || []).length >= 2);

  if (isQuoteRequest || hasQuoteAttributions) {
    return {
      isArtifact: true,
      artifactTitle: extractTitle('Quotes Collection'),
      artifactType: 'Quote',
    };
  }

  // 6. BIG ARTICLE & IN-DEPTH ESSAY (Only when user explicitly asked for an article, essay, paper, or report)
  const askedForBigArticle =
    /\b(write|create|draft|generate|compose|make)\s+(an?|the|me\s+an?)\s+(big\s+article|article|essay|deep\s+dive|research\s+paper|comprehensive\s+guide|whitepaper|long\s+article|report)\b/i.test(
      promptLower
    ) || /\b(article\s+on|essay\s+on|paper\s+on)\b/i.test(promptLower);

  // Strictly require that the user actually asked for an essay or article before treating it as an Article/Essay artifact
  if (askedForBigArticle && sourceText.length >= 350) {
    const isEssay =
      /\b(essay|thesis|introduction|conclusion|argument)\b/i.test(lower) ||
      /\bessay\b/i.test(promptLower);
    return {
      isArtifact: true,
      artifactTitle: extractTitle(isEssay ? 'Essay' : 'Big Article'),
      artifactType: isEssay ? 'Essay' : 'Article',
    };
  }

  // 7. SUMMARY (When user explicitly asked for a summary)
  const isSummaryRequest =
    /\b(summarize|summary|summarise|give\s+a\s+summary|tldr)\b/i.test(promptLower) &&
    sourceText.length >= 180;
  if (isSummaryRequest) {
    return {
      isArtifact: true,
      artifactTitle: extractTitle('Summary'),
      artifactType: 'Summary',
    };
  }

  // 8. Substantial Code Projects (only when user requested code and a substantial code fence exists)
  const isCodePrompt = /\b(write|create|build|generate|make|code|program|script|app|game|function)\b/i.test(
    promptLower
  );
  const closedCodeMatch = sourceText.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
  const openCodeMatch = sourceText.match(/```([a-zA-Z0-9_-]*)\n([\s\S]{30,})$/);
  const codeMatch = closedCodeMatch || openCodeMatch;
  if (
    isCodePrompt &&
    codeMatch &&
    codeMatch[2] &&
    codeMatch[2].trim().length >= 60 &&
    !sourceText.includes('sigma-ppt-slide-count-prompt')
  ) {
    const lang = codeMatch[1] ? codeMatch[1].toUpperCase() : 'Code';
    return {
      isArtifact: true,
      artifactTitle: extractTitle(`${lang} Code`),
      artifactType: 'Code',
    };
  }

  // Normal chat, everyday questions (e.g. "What is an atom?"), greetings, general knowledge, math calculations:
  // Strictly NOT library artifacts. No "Add to Library" or refinement action buttons are shown.
  return {
    isArtifact: false,
    artifactTitle: '',
    artifactType: 'Document',
  };
}
