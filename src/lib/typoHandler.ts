/**
 * Seamless Typo Normalizer & Gibberish Detector for Sigma AI
 *
 * Designed to:
 * 1. Understand common typos ("tel" -> "tell", "woh" -> "who", "helo" -> "hello") SILENTLY and seamlessly
 *    without nagging the user with "caught that typo".
 * 2. Answer naturally and concisely like ChatGPT and Google.
 * 3. Only if the input contains uninterpretable gibberish (e.g. "hwsd", "wasday", random keyboard mash)
 *    politely ask what they mean or guess with respectful emojis.
 */

import { INITIAL_WORD_DEFINITIONS } from './basicConversations';

// Common phonetic and typing corrections
const PHONETIC_CORRECTIONS: Record<string, string> = {
  // Greetings
  helo: 'hello',
  hllo: 'hello',
  helllo: 'hello',
  heloo: 'hello',
  hlo: 'hello',
  hy: 'hi',
  hye: 'hey',
  hii: 'hi',
  hiii: 'hi',
  heyy: 'hey',
  heyyy: 'hey',
  hay: 'hey',
  salam: 'salaam',
  slm: 'salaam',

  // Common spelling typos
  spel: 'spell',
  speling: 'spelling',
  spellng: 'spelling',
  writting: 'writing',
  writng: 'writing',
  defin: 'define',
  defination: 'definition',
  explan: 'explain',
  explian: 'explain',
  calclator: 'calculator',
  claculator: 'calculator',
  wether: 'weather',
  wheather: 'weather',

  // Question words & pronouns
  tel: 'tell',
  woh: 'who',
  cd: 'code',
  whos: 'who is',
  whois: 'who is',
  wht: 'what',
  wat: 'what',
  waht: 'what',
  wats: 'what is',
  whtis: 'what is',
  wich: 'which',
  whcih: 'which',
  whare: 'where',
  wher: 'where',
  hw: 'how',
  hwo: 'how',
  howw: 'how',
  yu: 'you',
  yuo: 'you',
  u: 'you',
  ur: 'your',
  yuor: 'your',
  yourslf: 'yourself',
  r: 'are',
  ar: 'are',
  thier: 'their',
  teh: 'the',
  taht: 'that',
  tahts: 'that is',
  thsi: 'this',
  tihs: 'this',
  thse: 'these',
  thsoe: 'those',
  onna: 'on a',
  dinosour: 'dinosaur',
  dinasour: 'dinosaur',
  dinasaur: 'dinosaur',
  adn: 'and',
  cna: 'can',
  wrok: 'work',
  knw: 'know',
  kno: 'know',
  idk: 'I do not know',
  cuz: 'because',
  bcz: 'because',
  bcuz: 'because',
  becuase: 'because',
  shw: 'show',
  plz: 'please',
  pls: 'please',
  thx: 'thanks',
  // Common spelling corrections (silent normalization without nagging)
  spelin: 'spelling',
  speld: 'spelled',
  defne: 'define',
  mening: 'meaning',
  menng: 'meaning',
  answr: 'answer',
  calculat: 'calculate',
  qusetion: 'question',
  computr: 'computer',
  langauge: 'language',
  someting: 'something',
  anyting: 'anything',
  becuse: 'because',
  mispell: 'misspell',
  grammer: 'grammar',
  diffrent: 'different',
  favrite: 'favorite',
  untill: 'until',
  beleive: 'believe',
  wierd: 'weird',
  peaple: 'people',
  frend: 'friend',
  thnx: 'thanks',
  thanku: 'thank you',
  gud: 'good',
  gd: 'good',
  creatr: 'creator',
  craetor: 'creator',
  owenr: 'owner',
  ayn: 'Ayaan',
  ayan: 'Ayaan',
  ayyan: 'Ayaan',
  haris: 'Haris',
  sgima: 'Sigma',
  sima: 'Sigma',
  atem: 'atom',
  atms: 'atoms',
  atmo: 'atom',
  gravty: 'gravity',
  photosinthesis: 'photosynthesis',
  elctron: 'electron',
  protn: 'proton',
  neutrn: 'neutron',
  molcule: 'molecule',
  energi: 'energy',
  scince: 'science',
  histroy: 'history',
};

// Known common acronyms and contextual meanings (matches User Screenshot 4)
export interface AmbiguousAcronymData {
  acronymExplanation: string;
  guess?: string;
}

export const KNOWN_AMBIGUOUS_ACRONYMS: Record<string, AmbiguousAcronymData> = {
  afa: {
    acronymExplanation: `"AFA" can mean different things depending on context. For example:
• **AFA** = As Far As (usually used as part of "AFAIK" = As Far As I Know)
• **AFA** = Air Force Academy
• **AFA** = American Football Association

If you tell me where you saw "AFA", I can tell you the exact meaning.`,
    guess: 'As Far As / Air Force Academy',
  },
  afaik: {
    acronymExplanation: `**AFAIK** stands for **"As Far As I Know"**—commonly used in texting and online chats! 😄`,
    guess: 'As Far As I Know',
  },
  idk: {
    acronymExplanation: `**IDK** stands for **"I Don't Know"**!`,
    guess: "I don't know",
  },
  brb: {
    acronymExplanation: `**BRB** stands for **"Be Right Back"**!`,
    guess: 'Be right back',
  },
  btw: {
    acronymExplanation: `**BTW** stands for **"By The Way"**!`,
    guess: 'By the way',
  },
  omg: {
    acronymExplanation: `**OMG** stands for **"Oh My God"** or **"Oh My Goodness"**!`,
    guess: 'Oh my god',
  },
  tbh: {
    acronymExplanation: `**TBH** stands for **"To Be Honest"**!`,
    guess: 'To be honest',
  },
  np: {
    acronymExplanation: `**NP** stands for **"No Problem"**!`,
    guess: 'No problem',
  },
};

// Recognized common English words, names, commands that should NOT be treated as meaningless
const COMMON_RECOGNIZED_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
  'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'us', 'help', 'hi', 'hello', 'hey', 'math', 'jargon', 'sigma',
  'ayan', 'ayaan', 'haris', 'vahaj', 'haider', 'ceo', 'coo', 'owner', 'creator', 'code', 'story',
  'news', 'date', 'weather', 'calc', 'calculate', 'spell', 'spelling', 'define', 'meaning', 'why',
  'fact', 'facts', 'joke', 'reset', 'clear', 'stop', 'play', 'test', 'yes', 'yep', 'nope', 'cool',
  'nice', 'great', 'fine', 'ok', 'okay', 'bye', 'goodbye', 'thanks', 'thank', 'sorry', 'welcome',
  'please', 'salam', 'salaam', 'peace', 'love', 'life', 'mind', 'world', 'earth', 'sun', 'moon',
  'star', 'ai', 'bot', 'chat', 'talk', 'read', 'write', 'learn', 'study', 'school', 'book', 'game',
  'music', 'song', 'art', 'draw', 'dog', 'cat', 'car', 'tree', 'water', 'fire', 'air',
  'ho', 'yo', 'sup', 'atom', 'atoms', 'cell', 'energy', 'gravity', 'science', 'history',
  'haan', 'han', 'bhai', 'bolo', 'acha', 'accha', 'theek', 'thik', 'kya', 'scene', 'hai',
  'yaar', 'kaise', 'batao', 'samjhao', 'nahi', 'nhi', 'mujhe', 'karo', 'chahiye', 'namaste',
]);

// Rotation counter tracking per word for varied responses
const inMemoryWordRotation: Record<string, number> = {};

/**
 * Returns a rotated friendly/entertaining response for single words that do not make sense.
 * Gives different answers at different times (Screenshots 2, 3, 4, keyboard slip / spelling mistake).
 */
export function getVariedSingleWordResponse(rawWord: string): string {
  const clean = rawWord.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  const lower = clean.toLowerCase();

  let count = 0;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storageKey = `sigma_word_rot_${lower}`;
      count = parseInt(sessionStorage.getItem(storageKey) || '0', 10);
      sessionStorage.setItem(storageKey, String((count + 1) % 5));
    } else {
      count = inMemoryWordRotation[lower] || 0;
      inMemoryWordRotation[lower] = (count + 1) % 5;
    }
  } catch (e) {
    count = inMemoryWordRotation[lower] || 0;
    inMemoryWordRotation[lower] = (count + 1) % 5;
  }

  const ambiguous = KNOWN_AMBIGUOUS_ACRONYMS[lower];
  const variantIndex = count % 5;

  switch (variantIndex) {
    case 0:
      // Screenshot 2: "Hey! 👋 What do you mean by 'afa'?"
      return `Hey! 👋 What do you mean by "${clean}"?`;
    case 1:
      // Screenshot 3: "Could you tell me what you mean by 'afa'? 😄"
      return `Could you tell me what you mean by "${clean}"? 😄`;
    case 2:
      // Screenshot 4: Context / meanings breakdown
      if (ambiguous?.acronymExplanation) {
        return ambiguous.acronymExplanation;
      }
      return `Could "${clean}" be an acronym or abbreviation? If you tell me where you saw "${clean}", I can tell you the exact meaning! 😄`;
    case 3:
      // Entertaining keyboard slip / spelling mistake style requested by user
      return `I can't understand "${clean}"—looks like your keyboard pressed a little spelling mistake! What did you mean? 😄`;
    case 4:
    default:
      if (ambiguous?.acronymExplanation) {
        return ambiguous.acronymExplanation;
      }
      return `Looks like a spelling mistake on "${clean}" or your keyboard slipped! What did you mean to type? ⌨️✨`;
  }
}

// Known common gibberish guesses
const GIBBERISH_GUESSES: Record<string, string> = {
  hwsd: 'how is it',
  wasday: 'what is today',
  asdf: 'hello',
  asdfgh: 'testing',
  qwerty: 'typing test',
  idk: 'I do not know',
  brb: 'be right back',
  gtg: 'got to go',
};

export interface PromptAnalysisResult {
  normalizedPrompt: string;
  isGibberish: boolean;
  isFarewell?: boolean;
  isGreeting?: boolean;
  isSingleKey?: boolean;
  isAffirmation?: boolean;
  gibberishWord?: string;
  suggestedGuess?: string;
  instantFriendlyResponse?: string;
}

/**
 * Checks if a word is meaningless gibberish (e.g. consonants only like "hwsd", "sdfg", etc.)
 */
function isWordGibberish(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length < 3) return false;

  // Words that match dictionary corrections are not gibberish
  if (PHONETIC_CORRECTIONS[clean]) return false;

  // If word has no vowels at all and length >= 4, likely keyboard mash (e.g. "hwsd", "zxcvb", "dfgh")
  const hasVowels = /[aeiouy]/.test(clean);
  if (!hasVowels && clean.length >= 4) {
    return true;
  }

  // Keyboard row mash (e.g. "asdfgh", "wasd", "hjkl")
  if (/^(asdf|wasd|qwer|zxcv|hjkl|jkl;)/i.test(clean) && clean.length >= 4) {
    return true;
  }

  return false;
}

/**
 * Checks if a short prompt is a contextual follow-up modifier (e.g. "one word", "shorter")
 */
export function isConversationalFollowUp(text: string): boolean {
  if (!text) return false;
  const lower = text.trim().toLowerCase();
  return /^(one\s+word|in\s+one\s+word|1\s+word|shorter|make\s+it\s+shorter|too\s+long|shorten|brief|more\s+details?|more|elaborate|expand|explain\s+like\s+i['’]m\s+5|eli5|simplify|simpler|example|give\s+an\s+example|why|how\s+so|condense|summarize|bullet\s+points?)$/i.test(
    lower
  );
}

/**
 * Normalizes common typos smoothly and detects if user wrote uninterpretable gibberish.
 */
export function analyzeAndNormalizePrompt(prompt: string): PromptAnalysisResult {
  if (!prompt || typeof prompt !== 'string') {
    return {
      normalizedPrompt: '',
      isGibberish: false,
    };
  }

  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check for standard greetings with small typos (e.g. "helo", "hello", "hi")
  if (/^(helo|hllo|helllo|heloo|hlo|hii+|heyy+|hye|hy|hello|hi|hey)\b/i.test(lower) && lower.split(/\s+/).length <= 2) {
    return {
      normalizedPrompt: 'hello',
      isGibberish: false,
      isGreeting: true,
      instantFriendlyResponse:
        "Hello! How can I assist you today? 😊✨",
    };
  }

  // 1b. Check for "how are you" / "how r u" for instant friendly conversational response
  if (
    /^(how\s+(are|r)\s+(you|yu|u)(\s+(doing|today))?|how('?s|\s+is)\s+it\s+going)\??$/i.test(lower)
  ) {
    return {
      normalizedPrompt: 'how are you',
      isGibberish: false,
      isGreeting: true,
      instantFriendlyResponse:
        "I'm doing well, thank you. How can I assist you?",
    };
  }

  // 1c. Special "Allah Hafiz" handling:
  // If someone says "Allah Hafiz", ask for clarification first unless explicit goodbye/bye is provided.
  if (/^(allah\s*hafiz|allah\s*hafiz!+|allahafiz)\b/i.test(lower)) {
    if (/(bye|goodbye|cya|see\s+you|leaving|end|ending|farewell)/i.test(lower)) {
      return {
        normalizedPrompt: 'allah hafiz farewell',
        isGibberish: false,
        isFarewell: true,
        instantFriendlyResponse: 'Allah Hafiz. Take care.',
      };
    }
    return {
      normalizedPrompt: 'allah hafiz clarification',
      isGibberish: false,
      instantFriendlyResponse:
        'Are you asking the meaning of Allah Hafiz, asking something related to it, or just saying bye?',
    };
  }

  // 2. Check for farewells (e.g. "bye", "byee", "goodbye", "see you", "gn")
  if (
    /^(bye|byee+|goodbye|cya|see\s+ya|see\s+you|bye\s+bye|take\s+care|good\s+night|gn|ttyl)\b/i.test(lower) &&
    lower.split(/\s+/).length <= 4
  ) {
    return {
      normalizedPrompt: 'bye',
      isGibberish: false,
      isFarewell: true,
      instantFriendlyResponse: 'Goodbye. Take care.',
    };
  }

  // 3. Check for quick affirmations (e.g. "ok", "okay", "alright", "cool", "nice")
  if (
    /^(ok|okay|k|alright|cool|got\s+it|nice|great|sounds\s+good)\b/i.test(lower) &&
    lower.split(/\s+/).length <= 3
  ) {
    return {
      normalizedPrompt: 'ok',
      isGibberish: false,
      isAffirmation: true,
      instantFriendlyResponse: 'Understood.',
    };
  }

  // 4. Check for thanks
  if (/^(thanks|thx|thnx|thank\s+you|thanku)\b/i.test(lower) && lower.split(/\s+/).length <= 3) {
    return {
      normalizedPrompt: 'thank you',
      isGibberish: false,
      isAffirmation: true,
      instantFriendlyResponse: "You're welcome.",
    };
  }

  // 5. Check for "tel me woh are you" / "who are you" questions
  if (
    /^(tel|tell)\s+(me\s+)?(woh|who|whos)\s+(r|are)\s+(yu|you)\??$/i.test(lower) ||
    /^(woh|who)\s+(r|are)\s+(yu|you)\??$/i.test(lower) ||
    /^(whos|who\s+is)\s+(sigma|yu|you)\??$/i.test(lower)
  ) {
    return {
      normalizedPrompt: 'tell me who are you',
      isGibberish: false,
      instantFriendlyResponse:
        "I am **Sigma AI**, an advanced AI assistant developed by the Pakistani company **Sigma.co** (Sigma Cooperation). Maintained by a dedicated team of three in the company (contact: `sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com`). How can I assist you today?",
    };
  }

  // 5b. Check for CEO queries (e.g. "who is your ceo", "who is ceo", "who is the ceo")
  if (
    /^(who('?s|\s+is)(\s+(your|the))?\s+ceo|who\s+is\s+ceo|whos\s+ceo|who\s+is\s+your\s+ceo|tell\s+me\s+(who\s+is\s+)?your\s+ceo)\??$/i.test(lower)
  ) {
    return {
      normalizedPrompt: 'who is your ceo',
      isGibberish: false,
      instantFriendlyResponse:
        "Sigma AI is developed by the technology company of Pakistan, **Sigma.co**, maintained by three people in the company (contact: `sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com`).",
    };
  }

  // 5c. Check for COO queries (e.g. "who is your coo", "who is coo")
  if (
    /^(who('?s|\s+is)(\s+(your|the))?\s+coo|who\s+is\s+coo|whos\s+coo|who\s+is\s+your\s+coo|tell\s+me\s+(who\s+is\s+)?your\s+coo)\??$/i.test(lower)
  ) {
    return {
      normalizedPrompt: 'who is your coo',
      isGibberish: false,
      instantFriendlyResponse:
        "Sigma AI is maintained by a specialized core team of three people at **Sigma.co** in Pakistan (contact: `sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com`).",
    };
  }

  // 5d. Check for Wahaj Haider queries
  if (
    /^(who('?s|\s+is)\s+)?(vahaj|wahaj)\s+(haider|heather|heder|hader)\??$/i.test(lower) ||
    /^(tel|tell)\s+me\s+(about\s+)?(vahaj|wahaj)\s+(haider|heather|heder|hader)\??$/i.test(lower)
  ) {
    return {
      normalizedPrompt: 'who is wahaj haider',
      isGibberish: false,
      instantFriendlyResponse:
        "Wahaj Haider is one of the operational managers and core maintainers at **Sigma.co** in Pakistan.",
    };
  }

  // 5e. Check for Owner queries / Creator queries
  if (
    /^(who('?s|\s+is)(\s+(your|the))?\s+(owner|creator)|who\s+created\s+you|who\s+owns\s+you)\??$/i.test(lower)
  ) {
    return {
      normalizedPrompt: 'who is your owner',
      isGibberish: false,
      instantFriendlyResponse:
        "Sigma AI is developed and maintained by **Sigma.co** (Sigma Cooperation), a technology company based in Pakistan, maintained by three people in the company (contact: `sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com`).",
    };
  }

  if (
    /^(who('?s|\s+is)(\s+(your|the))?\s+owner\s+(and|&)\s+ceo|who\s+is\s+ceo\s+(and|&)\s+owner)\??$/i.test(lower)
  ) {
    return {
      normalizedPrompt: 'who is your owner and ceo',
      isGibberish: false,
      instantFriendlyResponse:
        "Sigma AI is developed and maintained by **Sigma.co** (Sigma Cooperation) in Pakistan.",
    };
  }

  if (
    /^(who('?s|\s+is)(\s+(your|the))?\s+owner\s+(and|&)\s+coo|who\s+is\s+coo\s+(and|&)\s+owner|who\s+are\s+(the\s+)?(executives|leaders))\??$/i.test(lower)
  ) {
    return {
      normalizedPrompt: 'who is your owner and coo',
      isGibberish: false,
      instantFriendlyResponse:
        "Sigma AI is developed by **Sigma.co** in Pakistan and maintained by a dedicated team of three people in the company.",
    };
  }

  // 7. Check if prompt is a SINGLE WORD vs a COMPLETE SENTENCE
  const rawWords = trimmed.split(/\s+/);
  const isSingleWord = rawWords.length === 1;

  if (isSingleWord) {
    const cleanWord = trimmed.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase();

    // 1. If it's a minor spelling mistake recognized in PHONETIC_CORRECTIONS (e.g. "spel" -> "spell", "wrok" -> "work")
    // Per user directive: "if someone says any word that has a little spelling mistake, like 'spel' instead of 'spell,'
    // he will respond correctly and normally without saying 'spelling mistake.'"
    if (PHONETIC_CORRECTIONS[cleanWord]) {
      return {
        normalizedPrompt: PHONETIC_CORRECTIONS[cleanWord],
        isGibberish: false,
      };
    }

    // 2. If it's a recognized standard English word, name, or in dictionary definitions (e.g. "jargon", "math", "who", "apple")
    if (
      COMMON_RECOGNIZED_WORDS.has(cleanWord) ||
      INITIAL_WORD_DEFINITIONS[cleanWord] ||
      /^[0-9]+$/.test(cleanWord) ||
      cleanWord.length <= 1
    ) {
      return {
        normalizedPrompt: trimmed,
        isGibberish: false,
      };
    }

    // 3. The word DOES NOT MAKE SENSE (e.g. "afa", "asdf", "sdjf", keyboard slips, unrecognizable acronyms).
    // Per user directive: "He will give different answers at different times, but not only for a word from anyone spelling mistake word, but not for a whole complete sentence.
    // If the word does not make sense, when a user frequently asks, he will guess the words and tell the meaning of them or anything...
    // He has to say, 'I can't understand,' or 'Your keyboard has pressed a spelling mistake like that.'"
    const variedResponse = getVariedSingleWordResponse(trimmed);
    return {
      normalizedPrompt: cleanWord,
      isGibberish: true,
      gibberishWord: cleanWord,
      instantFriendlyResponse: variedResponse,
    };
  }

  // For a COMPLETE SENTENCE (multiple words):
  // Per user directive: never flag a whole complete sentence with "spelling mistake".
  // Silently normalize any minor typos and process normally.
  const normalizedWords: string[] = [];
  for (const token of rawWords) {
    const match = token.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/);
    if (!match) {
      normalizedWords.push(token);
      continue;
    }
    const [, lead, core, trail] = match;
    const lowerCore = core.toLowerCase();
    if (PHONETIC_CORRECTIONS[lowerCore]) {
      normalizedWords.push(`${lead}${PHONETIC_CORRECTIONS[lowerCore]}${trail}`);
    } else {
      normalizedWords.push(token);
    }
  }

  return {
    normalizedPrompt: normalizedWords.join(' '),
    isGibberish: false,
  };
}

/**
 * Note: Per user directive, never preemptively interrogate the user or ask what they would like first (e.g. definition, facts, story).
 * Provide direct answers without asking them first before.
 */
export function detectAmbiguousTopicQuery(_prompt: string): {
  isAmbiguousTopic: boolean;
  topicName?: string;
  clarifyingResponse?: string;
} {
  return { isAmbiguousTopic: false };
}

