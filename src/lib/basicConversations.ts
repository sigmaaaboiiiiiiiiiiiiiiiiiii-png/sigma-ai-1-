/**
 * Permanent Preloaded Knowledge Base:
 * 1. 100+ Core Everyday Basic Conversations & Greetings
 * 2. Preloaded Core Dictionary Definitions (including "jargon", "algorithm", etc.)
 * 
 * Saved forever and accessible across previews, published apps, and offline mode.
 */

export interface PreloadedQA {
  id: string;
  normalizedKey: string;
  aliases: string[];
  answer: string;
  category: 'conversation' | 'meaning' | 'calculation';
}

export const BASIC_CONVERSATIONS_100: PreloadedQA[] = [
  // 1. Greetings & Hellos (1-15)
  {
    id: 'bc-hello',
    normalizedKey: 'hello',
    aliases: ['hello', 'hello there', 'hey', 'hi', 'hi there', 'hey there', 'greetings', 'salutations', 'howdy'],
    answer: "Hello! 👋 Great to see you. How can I help you today?",
    category: 'conversation',
  },
  {
    id: 'bc-good-morning',
    normalizedKey: 'good morning',
    aliases: ['good morning', 'morning', 'mornin', 'gm', 'good morning to you'],
    answer: "Good morning! ☀️ Wishing you a productive and wonderful day ahead. What can I assist you with today?",
    category: 'conversation',
  },
  {
    id: 'bc-good-afternoon',
    normalizedKey: 'good afternoon',
    aliases: ['good afternoon', 'afternoon', 'good afternoon to you'],
    answer: "Good afternoon! 🌤️ Hope your day is going smoothly. How can I be of service?",
    category: 'conversation',
  },
  {
    id: 'bc-good-evening',
    normalizedKey: 'good evening',
    aliases: ['good evening', 'evening', 'good evening to you'],
    answer: "Good evening! 🌆 I hope you had a great day. How can I assist you tonight?",
    category: 'conversation',
  },
  {
    id: 'bc-good-night',
    normalizedKey: 'good night',
    aliases: ['good night', 'night', 'gn', 'sweet dreams', 'sleep well'],
    answer: "Good night! 🌙 Sleep well and have wonderful dreams. See you next time!",
    category: 'conversation',
  },
  {
    id: 'bc-howdy',
    normalizedKey: 'howdy',
    aliases: ['howdy partner', 'howdy there'],
    answer: "Howdy! 🤠 Always a pleasure. What can I do for you today?",
    category: 'conversation',
  },
  {
    id: 'bc-whats-up',
    normalizedKey: 'whats up',
    aliases: ['whats up', 'what is up', 'wassup', 'sup', 'what up'],
    answer: "Not much, just here and ready to help you with whatever you need! What's on your mind?",
    category: 'conversation',
  },
  {
    id: 'bc-whats-new',
    normalizedKey: 'whats new',
    aliases: ['whats new', 'what is new', 'anything new'],
    answer: "All systems are running fast and smooth! What can I help you with today?",
    category: 'conversation',
  },
  {
    id: 'bc-how-are-you',
    normalizedKey: 'how are you',
    aliases: ['how are you', 'how are you doing', 'how r u', 'how are things', 'how do you do', 'how goes it', 'how is it going', 'how is your day', 'how has your day been'],
    answer: "I'm doing fantastic, thank you for asking! 😊 How are you doing today, and how can I help you?",
    category: 'conversation',
  },
  {
    id: 'bc-nice-to-meet-you',
    normalizedKey: 'nice to meet you',
    aliases: ['nice to meet you', 'pleasure to meet you', 'glad to meet you', 'happy to meet you'],
    answer: "It's a genuine pleasure to meet you too! 🤝 How can I help make your day better?",
    category: 'conversation',
  },
  {
    id: 'bc-yo',
    normalizedKey: 'yo',
    aliases: ['yo', 'yoo', 'yooo'],
    answer: "Yo! 👋 How's everything going? What can I help you with?",
    category: 'conversation',
  },
  {
    id: 'bc-welcome',
    normalizedKey: 'welcome',
    aliases: ['welcome back', 'welcome'],
    answer: "Thank you! Glad to be here and always ready to assist you. 😊",
    category: 'conversation',
  },

  // 2. Identity, Name, and Creator (13-25)
  {
    id: 'bc-who-are-you',
    normalizedKey: 'who are you',
    aliases: ['who are you', 'who r u', 'what is your identity', 'tell me who you are', 'tell me about yourself', 'introduce yourself'],
    answer: "I am **Sigma AI**, an advanced AI assistant developed by the Pakistani company **Sigma.co** (Sigma Cooperation). Maintained by a dedicated team of three in the company (contact: `sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com`). How can I assist you today?",
    category: 'conversation',
  },
  {
    id: 'bc-what-is-your-name',
    normalizedKey: 'what is your name',
    aliases: ['what is your name', 'whats your name', 'what should i call you', 'do you have a name', 'your name'],
    answer: "My name is **Sigma AI**! An intelligent assistant developed by **Sigma.co** in Pakistan.",
    category: 'conversation',
  },
  {
    id: 'bc-who-made-you',
    normalizedKey: 'who made you',
    aliases: ['who made you', 'who created you', 'who built you', 'who is your creator', 'who is your owner', 'who owns you', 'who developed you', 'who is owner', 'who is the owner'],
    answer: "Sigma AI is developed and maintained by **Sigma.co** (Sigma Cooperation), a technology company based in Pakistan, maintained by three people in the company (contact: `sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com`).",
    category: 'conversation',
  },
  {
    id: 'bc-who-is-your-ceo',
    normalizedKey: 'who is your ceo',
    aliases: ['who is your ceo', 'who is the ceo', 'who is ceo', 'tell me who is your ceo', 'who is ceo of sigma ai', 'ceo name', 'ceo'],
    answer: "Sigma AI is developed by the technology company of Pakistan, **Sigma.co**, maintained by three people in the company (contact: `sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com`).",
    category: 'conversation',
  },
  {
    id: 'bc-who-is-your-coo',
    normalizedKey: 'who is your coo',
    aliases: [
      'who is your coo',
      'who is the coo',
      'who is coo',
      'tell me who is your coo',
      'who is coo of sigma ai',
      'coo name',
      'what is your coo',
      'what is the name of your coo',
      'who is vahaj haider',
      'vahaj haider',
      'who is wahaj haider',
      'wahaj haider'
    ],
    answer: "Sigma AI is maintained by a specialized core team of three people at **Sigma.co** in Pakistan (contact: `sigmaaaboiiiiiiiiiiiiiiiiiii@gmail.com`).",
    category: 'conversation',
  },
  {
    id: 'bc-who-is-owner-and-coo',
    normalizedKey: 'who is your owner and coo',
    aliases: [
      'who is your owner and coo',
      'who is the owner and coo',
      'who are your owner and coo',
      'who is owner and who is coo',
      'who is your owner and who is your coo',
      'who is your owner and ceo'
    ],
    answer: "Sigma AI is developed by **Sigma.co** in Pakistan and maintained by a dedicated team of three people in the company.",
    category: 'conversation',
  },
  {
    id: 'bc-who-is-ayaan-haris',
    normalizedKey: 'who is ayaan haris',
    aliases: ['who is ayaan haris', 'who is ayaan', 'tell me about ayaan haris'],
    answer: "Ayaan Haris is one of the software maintainers at **Sigma.co** in Pakistan.",
    category: 'conversation',
  },
  {
    id: 'bc-are-you-ai',
    normalizedKey: 'are you an ai',
    aliases: ['are you an ai', 'are you ai', 'are you a robot', 'are you human', 'are you real'],
    answer: "Yes, I am **Sigma AI**, an artificial intelligence. While I am not human, I am designed to assist and collaborate with you just like a knowledgeable friend!",
    category: 'conversation',
  },
  {
    id: 'bc-what-can-you-do',
    normalizedKey: 'what can you do',
    aliases: ['what can you do', 'what are your capabilities', 'what are your features', 'how can you help me', 'what do you do'],
    answer: "What can I help you with today?",
    category: 'conversation',
  },
  {
    id: 'bc-how-old-are-you',
    normalizedKey: 'how old are you',
    aliases: ['how old are you', 'what is your age', 'when were you born', 'when were you created'],
    answer: "I don't have a physical age in human years, but I am continuously updated and learning every single day!",
    category: 'conversation',
  },
  {
    id: 'bc-where-do-you-live',
    normalizedKey: 'where do you live',
    aliases: ['where do you live', 'where are you from', 'where are you located', 'where are you'],
    answer: "I live in the cloud and right here on your screen, accessible anytime, anywhere you need me!",
    category: 'conversation',
  },
  {
    id: 'bc-what-language',
    normalizedKey: 'what languages do you speak',
    aliases: ['what languages do you speak', 'do you speak english', 'what languages can you understand'],
    answer: "I can understand and communicate in many languages, with primary fluency in English! Feel free to talk in whichever language you prefer.",
    category: 'conversation',
  },

  // 3. Courtesies, Thanks, and Affirmations (26-45)
  {
    id: 'bc-thank-you',
    normalizedKey: 'thank you',
    aliases: ['thank you', 'thanks', 'thx', 'thnx', 'thanku', 'thank you so much', 'thanks a lot', 'many thanks', 'appreciate it', 'i appreciate your help'],
    answer: "You are very welcome! 😊 Always happy to help. Let me know whenever you need anything else!",
    category: 'conversation',
  },
  {
    id: 'bc-you-are-welcome',
    normalizedKey: 'you are welcome',
    aliases: ['you are welcome', 'youre welcome', 'ur welcome', 'no problem', 'anytime'],
    answer: "Glad we could collaborate! I'm here whenever you have more questions. ✨",
    category: 'conversation',
  },
  {
    id: 'bc-ok',
    normalizedKey: 'ok',
    aliases: ['ok', 'okay', 'k', 'kk', 'alright', 'got it', 'understood', 'sounds good', 'cool', 'nice', 'great'],
    answer: "Understood! 👍 Let me know whenever you're ready for the next step.",
    category: 'conversation',
  },
  {
    id: 'bc-yes',
    normalizedKey: 'yes',
    aliases: ['yes', 'yeah', 'yep', 'yup', 'sure', 'certainly', 'definitely', 'absolutely'],
    answer: "Awesome! Let's proceed. What would you like to explore next?",
    category: 'conversation',
  },
  {
    id: 'bc-no',
    normalizedKey: 'no',
    aliases: ['no', 'nope', 'nah', 'not really', 'no thanks'],
    answer: "Understood! Let me know whenever you'd like to explore anything else.",
    category: 'conversation',
  },
  {
    id: 'bc-you-are-awesome',
    normalizedKey: 'you are awesome',
    aliases: ['you are awesome', 'you are great', 'you are the best', 'you are cool', 'you rock', 'you are amazing', 'good job', 'well done', 'nice work'],
    answer: "Thank you so much! That means a lot. 😊 I'm always striving to give you the best experience possible!",
    category: 'conversation',
  },
  {
    id: 'bc-you-are-smart',
    normalizedKey: 'you are smart',
    aliases: ['you are smart', 'you are intelligent', 'you are clever', 'you are a genius'],
    answer: "Thank you! I give all credit to the engineering team at **Sigma.co** and the vast world of knowledge I draw from.",
    category: 'conversation',
  },
  {
    id: 'bc-sorry',
    normalizedKey: 'sorry',
    aliases: ['sorry', 'i am sorry', 'my bad', 'apologies', 'excuse me'],
    answer: "No need to apologize at all! Everything is completely fine. 😊 How can I help you?",
    category: 'conversation',
  },

  // 4. Farewells & Goodbyes (46-60)
  {
    id: 'bc-bye',
    normalizedKey: 'bye',
    aliases: ['bye', 'goodbye', 'bye bye', 'cya', 'see you', 'see ya', 'see you later', 'talk to you later', 'ttyl', 'farewell', 'take care', 'catch you later'],
    answer: "Goodbye! 👋 Take care and have a wonderful day ahead. Come back anytime!",
    category: 'conversation',
  },
  {
    id: 'bc-have-a-nice-day',
    normalizedKey: 'have a nice day',
    aliases: ['have a nice day', 'have a good day', 'have a great day', 'have a wonderful day'],
    answer: "Thank you! I wish you a truly wonderful and productive day too! 🌟",
    category: 'conversation',
  },
  {
    id: 'bc-see-you-tomorrow',
    normalizedKey: 'see you tomorrow',
    aliases: ['see you tomorrow', 'until tomorrow', 'till tomorrow'],
    answer: "See you tomorrow! Have a restful evening and great night. 👋🌙",
    category: 'conversation',
  },

  // 5. Fun, Jokes, and Riddles (61-75)
  {
    id: 'bc-tell-me-a-joke',
    normalizedKey: 'tell me a joke',
    aliases: ['tell me a joke', 'joke', 'make me laugh', 'can you tell a joke', 'say a joke'],
    answer: "Why don't scientists trust atoms?\n\nBecause they make up everything! 😄🔬",
    category: 'conversation',
  },
  {
    id: 'bc-tell-another-joke',
    normalizedKey: 'tell me another joke',
    aliases: ['tell me another joke', 'another joke', 'one more joke'],
    answer: "Why did the computer catch a cold?\n\nBecause someone left a Windows open! 💻❄️😂",
    category: 'conversation',
  },
  {
    id: 'bc-tell-me-a-riddle',
    normalizedKey: 'tell me a riddle',
    aliases: ['tell me a riddle', 'give me a riddle', 'riddle me this'],
    answer: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?\n\n**Answer**: An echo! 📢✨",
    category: 'conversation',
  },
  {
    id: 'bc-fun-fact',
    normalizedKey: 'tell me a fun fact',
    aliases: ['tell me a fun fact', 'fun fact', 'interesting fact', 'tell me something interesting'],
    answer: "Did you know? Honey never spoils! Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible. 🍯✨",
    category: 'conversation',
  },
  {
    id: 'bc-flip-a-coin',
    normalizedKey: 'flip a coin',
    aliases: ['flip a coin', 'heads or tails', 'toss a coin'],
    answer: Math.random() > 0.5 ? "🪙 The coin landed on **Heads**!" : "🪙 The coin landed on **Tails**!",
    category: 'conversation',
  },
  {
    id: 'bc-roll-a-die',
    normalizedKey: 'roll a die',
    aliases: ['roll a die', 'roll a dice', 'roll dice'],
    answer: `🎲 You rolled a **${Math.floor(Math.random() * 6) + 1}**!`,
    category: 'conversation',
  },

  // 6. Help, Offline & System Status (76-90)
  {
    id: 'bc-help',
    normalizedKey: 'help',
    aliases: ['help', 'i need help', 'can you help me', 'assist me', 'support'],
    answer: "I'm right here to help! You can ask me:\n- The **meaning of any word** (e.g., *'meaning of word jargon'*)\n- Any **calculation** (e.g., *'25 * 40'*)\n- Everyday conversation or questions\n\nWhat would you like assistance with?",
    category: 'conversation',
  },
  {
    id: 'bc-are-you-online',
    normalizedKey: 'are you online',
    aliases: ['are you online', 'are you working', 'are you active', 'is system up'],
    answer: "Yes, I am fully online, active, and operational! 🚀 Ready to answer your questions instantly.",
    category: 'conversation',
  },
  {
    id: 'bc-what-time-is-it',
    normalizedKey: 'what time is it',
    aliases: ['what time is it', 'current time', 'tell me the time', 'what is the time'],
    answer: `The current local time is **${new Date().toLocaleTimeString()}** (${new Date().toLocaleDateString()}). ⏰`,
    category: 'conversation',
  },
  {
    id: 'bc-what-day-is-today',
    normalizedKey: 'what day is today',
    aliases: ['what day is today', 'what is today', 'todays date', 'what date is today'],
    answer: `Today is **${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**. 📅`,
    category: 'conversation',
  },

  // 7. Everyday General Knowledge Fast Q&As (91-105)
  {
    id: 'bc-what-is-water',
    normalizedKey: 'what is water made of',
    aliases: ['what is water made of', 'chemical formula of water', 'what is water'],
    answer: "Water is a chemical compound consisting of two hydrogen atoms bonded to one oxygen atom (**H₂O**). It covers about 71% of Earth's surface and is essential for all known forms of life. 💧",
    category: 'conversation',
  },
  {
    id: 'bc-speed-of-light',
    normalizedKey: 'what is the speed of light',
    aliases: ['what is the speed of light', 'speed of light', 'how fast is light'],
    answer: "The speed of light in a vacuum is exactly **299,792,458 meters per second** (approximately **300,000 km/s** or **186,282 miles per second**). ⚡",
    category: 'conversation',
  },
  {
    id: 'bc-why-is-sky-blue',
    normalizedKey: 'why is the sky blue',
    aliases: ['why is the sky blue', 'why sky is blue'],
    answer: "The sky is blue due to a phenomenon called **Rayleigh scattering**. Earth's atmosphere scatters sunlight in all directions, and because blue light travels in smaller, shorter waves than other colors, it scatters more than other colors, making the sky appear blue to our eyes. 🌤️",
    category: 'conversation',
  },
  {
    id: 'bc-largest-ocean',
    normalizedKey: 'what is the largest ocean',
    aliases: ['what is the largest ocean', 'largest ocean on earth', 'biggest ocean'],
    answer: "The **Pacific Ocean** is the largest and deepest ocean on Earth, covering more than 60 million square miles (over 30% of the planet's surface). 🌊",
    category: 'conversation',
  },
  {
    id: 'bc-tallest-mountain',
    normalizedKey: 'what is the tallest mountain',
    aliases: ['what is the tallest mountain', 'highest mountain in the world', 'tallest mountain'],
    answer: "**Mount Everest** is Earth's highest mountain above sea level, standing at **8,848.86 meters (29,031.7 feet)** in the Himalayas. 🏔️",
    category: 'conversation',
  },
  {
    id: 'bc-capital-of-france',
    normalizedKey: 'what is the capital of france',
    aliases: ['what is the capital of france', 'capital of france'],
    answer: "The capital of France is **Paris**. 🇫🇷",
    category: 'conversation',
  },
  {
    id: 'bc-what-is-ai',
    normalizedKey: 'what is artificial intelligence',
    aliases: ['what is artificial intelligence', 'what is ai', 'define ai'],
    answer: "**Artificial Intelligence (AI)** is a field of computer science dedicated to creating systems capable of performing tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and translation between languages. 🤖💡",
    category: 'conversation',
  },
  {
    id: 'bc-what-is-gravity',
    normalizedKey: 'what is gravity',
    aliases: ['what is gravity', 'define gravity', 'how does gravity work'],
    answer: "**Gravity** is the universal force of attraction acting between all matter. On Earth, gravity gives weight to physical objects and causes the ocean tides. In physics, Einstein described gravity as the curvature of spacetime caused by mass and energy. 🌌",
    category: 'conversation',
  },
  {
    id: 'bc-what-is-pi',
    normalizedKey: 'what is pi',
    aliases: ['what is pi', 'value of pi', 'define pi'],
    answer: "**Pi (π)** is a mathematical constant representing the ratio of a circle's circumference to its diameter. It is an irrational number approximately equal to **3.1415926535...** (or 22/7 as a common fraction). 🥧",
    category: 'conversation',
  },
  {
    id: 'bc-earth-distance-sun',
    normalizedKey: 'how far is the sun from earth',
    aliases: ['how far is the sun from earth', 'distance from earth to sun', 'distance to sun'],
    answer: "The average distance from Earth to the Sun is approximately **149.6 million kilometers** (**93 million miles**), a distance defined in astronomy as **1 Astronomical Unit (AU)**. Sunlight takes about 8 minutes and 20 seconds to reach Earth. ☀️",
    category: 'conversation',
  },
  {
    id: 'bc-network-hiccup',
    normalizedKey: 'what is network hiccup',
    aliases: [
      'what is network hiccup',
      'what does network hiccup mean',
      'what is meaning of network hiccup',
      'meaning of network hiccup',
      'what it mean by network hiccup',
      'what it means by network hiccup',
      'what does it mean',
      'what is its meaning',
      'what it mean',
      'network hiccup meaning',
    ],
    answer:
      'A **network hiccup** means a temporary, momentary interruption or brief pause in your internet connection or server communication. 🌐⚡\n\nIt is usually short-lived and harmless. As soon as your Wi-Fi or mobile data stabilizes, sending your message again works smoothly and directly!',
    category: 'meaning',
  },
];

export const INITIAL_WORD_DEFINITIONS: Record<string, string> = {
  'network hiccup':
    '• **Core Meaning:** A **network hiccup** means a brief, temporary pause or momentary disruption in your internet connection or server communication.\n\n• **Why It Happens:** Minor Wi-Fi packet drops, router reconnection, or brief server load.\n\n• **In Simple Words:** It is not a permanent error; once connection stabilizes for a moment, retrying your request works immediately! 🌐⚡',
  'hiccup':
    '• **Everyday Meaning:** A sudden, involuntary spasm of the diaphragm.\n\n• **Tech & Slang Meaning:** A temporary problem, glitch, or minor setback (e.g., "a brief network hiccup").',
  '69':
    "I can't help with explicit adult content or tell you how to do, open, or see it, but I can tell you what **69** means:\n\n• **Sexual Slang Meaning (Sex Pose):** \"69\" is a widely known slang term for a sexual position (sex pose) where two partners align their bodies in opposite directions.\n\n• **Why It Is Called \"69\":** The digits \"6\" and \"9\" are upside-down mirror images of each other, visually representing two people facing opposite directions.\n\n• **Internet & Meme Culture:** Online and in pop culture, people often say \"Nice\" as a humorous slang reaction whenever the number 69 appears.\n\n• **Mathematical Meaning:** In math, 69 is the whole number after 68 and before 70 (equal to 3 × 23).",
  jargon:
    '• **Meaning:** **Jargon** means special words or expressions used by a particular profession, group, or subject that may be difficult for ordinary people to understand.\n\n' +
    '• **Medical Example:** Doctors use jargon like "hypertension" instead of simply saying "high blood pressure."\n\n' +
    '• **Tech Example:** Computer experts use jargon like "RAM," "CPU," and "debugging."\n\n' +
    '• **Legal Example:** Lawyers use jargon like "plaintiff" and "defendant."\n\n' +
    '• **In Simple Words:** Jargon = specialized language used by a particular group or profession.',
  atom:
    '• **Core Meaning:** An **atom** is the smallest basic unit of an element that still has the properties of that element.\n\n' +
    '• **Nucleus (Center):** It has a nucleus at the center containing positively charged protons (+) and neutral neutrons (0).\n\n' +
    '• **Electrons (Outer Shells):** Negatively charged electrons (−) move rapidly around the nucleus in energy levels or shells.\n\n' +
    '• **Element Identity:** The number of protons in the nucleus determines which element the atom is.\n\n' +
    '• **In Simple Words:** An atom is like a tiny building block that makes up all ordinary matter.',
  algorithm:
    "• **Core Meaning:** An **algorithm** is a clear, step-by-step set of instructions or rules followed by a computer or person to solve a problem.\n\n• **Everyday Example:** A cooking recipe is an everyday algorithm because you follow each step in order to prepare a dish.\n\n• **In Computing:** Computers use algorithms to sort data, search information, and run applications.",
  paradigm:
    "**Core Meaning:** A **paradigm** is a standard pattern, example, or model for how people understand or do something.\n\n**Paradigm Shift:** A \"paradigm shift\" is a major change from one way of thinking to a completely new approach.",
  dichotomy:
    "**Core Meaning:** A **dichotomy** is a sharp division or contrast between two things that are completely opposite or different.\n\n**Simple Example:** Good versus evil, or day versus night, is a classic dichotomy.",
  serendipity:
    "**Core Meaning:** **Serendipity** means finding something good, helpful, or wonderful by pure luck when you were not looking for it.\n\n**Simple Example:** Discovering a great new book or bumping into an old friend by accident is serendipity.",
  ephemeral:
    "**Core Meaning:** **Ephemeral** describes something that lasts for only a very short time; temporary or fleeting.\n\n**Simple Example:** Morning dew, rainbows, and 24-hour social media stories are ephemeral.",
  pragmatic:
    "**Core Meaning:** **Pragmatic** means dealing with things sensibly and realistically based on what actually works in real life.\n\n**In Simple Words:** A pragmatic person focuses on practical results instead of just theories.",
  lucid:
    "**Core Meaning:** **Lucid** means expressed clearly and very easy to understand.\n\n**Second Meaning:** It also means thinking clearly and being fully aware (such as a \"lucid dream\").",
  eloquent:
    "**Core Meaning:** **Eloquent** means fluent, persuasive, and vividly expressive in speaking or writing.\n\n**Simple Example:** An eloquent speaker explains ideas smoothly and powerfully.",
  ubiquitous:
    "**Core Meaning:** **Ubiquitous** means present, appearing, or found everywhere at the same time.\n\n**Simple Example:** Smartphones and Wi-Fi are ubiquitous in modern life.",
  benevolent:
    "**Core Meaning:** **Benevolent** means well-meaning, kind, and generous toward other people.\n\n**Simple Example:** Helping people in need without expecting anything back is a benevolent act.",
  resilient:
    "**Core Meaning:** **Resilient** describes the ability to recover and bounce back quickly from difficulties or tough times.\n\n**Physical Meaning:** It also means springing back into shape after being bent or stretched.",
  metaphor:
    "**Core Meaning:** A **metaphor** is a figure of speech that explains one thing by directly comparing it to another without using \"like\" or \"as\".\n\n**Simple Example:** Saying \"time is a thief\" is a metaphor.",
  hyperbole:
    "**Core Meaning:** **Hyperbole** is an intentional exaggeration used for emphasis or humor, not meant to be taken literally.\n\n**Simple Example:** Saying \"I have told you a million times\" is hyperbole.",
  synergy:
    "**Core Meaning:** **Synergy** is when two or more people or groups work together to create a combined result greater than what they could do separately.\n\n**In Simple Words:** Great teamwork where 1 + 1 equals 3.",
  syntax:
    "**Language Meaning:** **Syntax** is the set of rules for how words are arranged to form clear sentences.\n\n**Coding Meaning:** In programming, syntax is the exact structure and symbols a computer requires to run code.",
  semantics:
    "**Core Meaning:** **Semantics** is the study of the actual meaning of words, phrases, and symbols in language or logic.\n\n**Simple Difference:** Syntax is how a sentence is structured, while semantics is what the sentence actually means.",
  entropy:
    "**Science Meaning:** **Entropy** is a scientific measure of randomness, disorder, or chaos in a system.\n\n**Everyday Example:** A tidy room naturally becomes messy over time if no energy is used to clean it — that increase in disorder is entropy.",
  heuristic:
    "**Core Meaning:** A **heuristic** is a practical rule of thumb, mental shortcut, or educated guess used to solve problems quickly.\n\n**Why It Helps:** It gives you a fast, practical answer when checking every single option would take too long.",
  cache:
    "**Core Meaning:** A **cache** is a high-speed temporary storage area where a device keeps frequently used data.\n\n**Why It Matters:** Caching lets apps and websites load much faster the next time you open them.",
  latency:
    "**Core Meaning:** **Latency** is the time delay between an action starting and the response arriving.\n\n**Simple Example:** Low latency in online games or calls means instant response with no lag.",
  recursion:
    "**Core Meaning:** **Recursion** is a method in coding and math where a function solves a problem by calling itself on smaller steps until reaching a stopping point.\n\n**Simple Analogy:** Looking into two mirrors facing each other creates a recursive reflection.",
  photosynthesis:
    "**Core Meaning:** **Photosynthesis** is the process by which green plants use sunlight, water, and carbon dioxide to make their own food (glucose).\n\n**Why It Is Important:** Plants release the oxygen we breathe as a result of photosynthesis.",
  gravity:
    "**Core Meaning:** **Gravity** is the natural invisible force that pulls objects with mass toward each other.\n\n**Why It Matters:** Gravity keeps us on the ground and holds the Earth in orbit around the Sun.",
  democracy:
    "**Core Meaning:** **Democracy** is a system of government where power belongs to the people.\n\n**How It Works:** Citizens vote to elect representatives and shape laws.",
  empathy:
    "**Core Meaning:** **Empathy** is the ability to understand and share the feelings and perspective of another person.\n\n**In Simple Words:** Putting yourself in someone else's shoes.",
  integrity:
    "**Core Meaning:** **Integrity** is the quality of being honest, trustworthy, and sticking to strong moral principles.\n\n**In Simple Words:** Doing the right thing even when no one is watching.",
  catalyst:
    "**Science Meaning:** A **catalyst** is a substance that speeds up a chemical reaction without being used up.\n\n**Everyday Meaning:** A person or event that sparks a major change quickly.",
  nostalgia:
    "**Core Meaning:** **Nostalgia** is a warm, sentimental longing for happy moments, places, or memories from the past.\n\n**Simple Example:** Smiling when you hear a song from your childhood.",
  ambiguity:
    "**Core Meaning:** **Ambiguity** means something is open to more than one meaning or interpretation.\n\n**In Simple Words:** When a word or statement can mean multiple different things.",
  mitigate:
    "**Core Meaning:** To **mitigate** means to make something bad, risky, or painful less severe or less harmful.\n\n**Simple Example:** Wearing a helmet helps mitigate head injuries.",
  conundrum:
    "**Core Meaning:** A **conundrum** is a confusing and difficult problem, dilemma, or question.\n\n**In Simple Words:** A tough puzzle with no easy answer.",
  oxymoron:
    "**Core Meaning:** An **oxymoron** is a phrase that combines two opposite or contradictory words right next to each other.\n\n**Simple Examples:** \"Deafening silence\", \"bittersweet\", and \"open secret\".",
  anecdote:
    "**Core Meaning:** An **anecdote** is a short, interesting, or amusing story about a real incident or person.\n\n**Why People Use It:** Sharing a quick personal anecdote makes an explanation easier to relate to.",
  quintessential:
    "**Core Meaning:** **Quintessential** means representing the most perfect, classic, or typical example of something.\n\n**Simple Example:** A double-decker bus is a quintessential symbol of London.",
  tenacious:
    "**Core Meaning:** **Tenacious** means persistent, determined, and refusing to give up easily.\n\n**In Simple Words:** Holding on tightly to your goal until you succeed.",
  altruism:
    "**Core Meaning:** **Altruism** is selfless concern and helpful action for the well-being of others without expecting anything back.\n\n**Simple Example:** Helping a stranger purely out of kindness.",
  facetious:
    "**Core Meaning:** **Facetious** means treating serious issues with playfully inappropriate or flippant humor.\n\n**In Simple Words:** Joking around when people expect a serious response.",
  juxtaposition:
    "**Core Meaning:** **Juxtaposition** is placing two contrasting things side by side to highlight their differences.\n\n**Simple Example:** Showing bright sunlight right next to dark storm clouds.",
  cacophony:
    "**Core Meaning:** A **cacophony** is a harsh, loud, and unpleasant mixture of clashing sounds.\n\n**Simple Example:** Traffic horns, alarms, and construction noise all happening at once.",
  gargantuan:
    "**Core Meaning:** **Gargantuan** means enormous, gigantic, or massive in size or scale.\n\n**Simple Example:** Whales are gargantuan ocean creatures.",
  vicarious:
    "**Core Meaning:** **Vicarious** means experiencing a feeling or adventure indirectly through someone else's experience.\n\n**Simple Example:** Feeling thrilled while watching a travel vlog of a place you haven't visited yet.",
  fastidious:
    "**Core Meaning:** **Fastidious** means being very careful and attentive about every small detail, accuracy, and cleanliness.\n\n**In Simple Words:** Wanting every detail done neatly and accurately.",
  superfluous:
    "**Core Meaning:** **Superfluous** means more than what is needed; extra or unnecessary.\n\n**Simple Example:** Adding sugar to a drink that is already very sweet is superfluous.",
  scrutiny:
    "**Core Meaning:** **Scrutiny** is close, careful examination or critical inspection of every detail.\n\n**Simple Example:** Contracts are read under close scrutiny before signing.",
  procrastination:
    "**Core Meaning:** **Procrastination** is the act of delaying or putting off tasks that need to be done.\n\n**Simple Fix:** Starting with just one small step helps overcome procrastination.",
  epiphany:
    "**Core Meaning:** An **epiphany** is a sudden moment of clear realization or deep understanding.\n\n**In Simple Words:** A sudden \"aha!\" lightbulb moment.",
  equilibrium:
    "**Core Meaning:** **Equilibrium** is a state of balance where opposing forces are equal and stable.\n\n**Everyday Meaning:** Staying calm and balanced under pressure.",
  inevitable:
    "**Core Meaning:** **Inevitable** describes something that is certain to happen and impossible to avoid.\n\n**Simple Example:** Sunrise every morning is inevitable.",
  veracity:
    "**Core Meaning:** **Veracity** means truthfulness, honesty, and factual accuracy.\n\n**Simple Example:** Checking sources helps confirm the veracity of news.",
};
