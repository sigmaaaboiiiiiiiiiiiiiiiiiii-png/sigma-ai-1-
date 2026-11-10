import React, { useState, useEffect, useRef } from 'react';

export const DEFAULT_GREETING_MESSAGES = [
  'How can I assist you today?',
  'What can I do for you?',
  'Is there anything I can assist you with?',
  'How may I be of service?',
  'Can I lend a hand?',
  'Need some help?',
];

export const GREETINGS_BY_LANGUAGE: Record<string, string[]> = {
  'English (US)': DEFAULT_GREETING_MESSAGES,
  Spanish: [
    '¿Cómo puedo ayudarte hoy?',
    '¿En qué te puedo colaborar?',
    '¿Hay algo con lo que te pueda ayudar?',
    '¿Cómo puedo servirte?',
    '¿Puedo darte una mano?',
    '¿Necesitas ayuda?',
  ],
  French: [
    'Comment puis-je vous aider aujourd’hui ?',
    'Que puis-je faire pour vous ?',
    'Puis-je vous être utile ?',
    'Comment puis-je vous assister ?',
    'Puis-je vous donner un coup de main ?',
    'Besoin d’aide ?',
  ],
  German: [
    'Wie kann ich Ihnen heute helfen?',
    'Was kann ich für Sie tun?',
    'Kann ich Ihnen behilflich sein?',
    'Wie darf ich Ihnen dienen?',
    'Kann ich zur Hand gehen?',
    'Brauchen Sie Hilfe?',
  ],
  Japanese: [
    '本日はどのようなご用件でしょうか？',
    '何かお手伝いできることはありますか？',
    'ご用件を伺いましょうか？',
    '何かお手伝いしましょうか？',
    'お困りですか？',
  ],
  Urdu: [
    'آج میں آپ کی کیا مدد کر سکتا ہوں؟',
    'میں آپ کے لیے کیا کر سکتا ہوں؟',
    'کیا آپ کو کسی مدد کی ضرورت ہے؟',
    'میں کس طرح آپ کی خدمت کر سکتا ہوں؟',
    'کیا میں آپ کا ہاتھ بٹا سکتا ہوں؟',
    'کچھ مدد چاہیے؟',
  ],
  Hindi: [
    'आज मैं आपकी क्या सहायता कर सकता हूँ?',
    'मैं आपके लिए क्या कर सकता हूँ?',
    'क्या आपको किसी सहायता की आवश्यकता है?',
    'क्या मैं आपकी कोई मदद कर सकता हूँ?',
    'क्या आपको कोई मदद चाहिए?',
  ],
  Hinglish: [
    'Aaj main aapki kya madad kar sakta hoon?',
    'Main aapke liye kya kar sakta hoon?',
    'Kya aapko koi help chahiye?',
    'Bolo bhai, kya scene hai?',
    'Haan ji, bataiye kya poochhna chahte hain?',
  ],
};

interface TypingGreetingProps {
  messages?: string[];
  language?: string;
  typingSpeedBase?: number;
  backspaceSpeedBase?: number;
  pauseBeforeDeleteMs?: number;
  pauseBeforeNextMs?: number;
  className?: string;
  cursorColor?: string;
  disableAnimation?: boolean;
}

export const TypingGreeting: React.FC<TypingGreetingProps> = ({
  messages: customMessages,
  language = 'English (US)',
  typingSpeedBase = 65,
  backspaceSpeedBase = 40,
  pauseBeforeDeleteMs = 2800,
  pauseBeforeNextMs = 500,
  className = '',
  cursorColor = '#00ea77',
  disableAnimation = false,
}) => {
  const activeMessages =
    customMessages || GREETINGS_BY_LANGUAGE[language] || DEFAULT_GREETING_MESSAGES;

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [phase, setPhase] = useState<'initial-cursor' | 'typing' | 'pausing' | 'deleting' | 'waiting'>(
    'initial-cursor'
  );

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when language changes so new translated message types immediately
  useEffect(() => {
    setCurrentMessageIndex(0);
    setDisplayedText('');
    setPhase('initial-cursor');
  }, [language]);

  useEffect(() => {
    if (disableAnimation) {
      setDisplayedText(activeMessages[0] || 'How can I assist you today?');
      return;
    }

    const currentFullText = activeMessages[currentMessageIndex] || '';

    // Phase 1: Initial cursor blink before first character types
    if (phase === 'initial-cursor') {
      timeoutRef.current = setTimeout(() => {
        setPhase('typing');
      }, 700);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    // Phase 2: Typing letter by letter
    if (phase === 'typing') {
      if (displayedText.length < currentFullText.length) {
        // Natural typing speed variation (adds realistic human micro-delays for punctuation and spaces)
        const nextChar = currentFullText[displayedText.length];
        let delay = typingSpeedBase + (Math.random() * 40 - 20);
        if (nextChar === ' ' || nextChar === '?' || nextChar === ',') {
          delay += 70;
        }

        timeoutRef.current = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        }, Math.max(25, delay));
      } else {
        // Full message has been typed, transition to pause
        setPhase('pausing');
      }
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    // Phase 3: Pause while user reads complete sentence
    if (phase === 'pausing') {
      timeoutRef.current = setTimeout(() => {
        setPhase('deleting');
      }, pauseBeforeDeleteMs);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    // Phase 4: Backspace letter by letter from end
    if (phase === 'deleting') {
      if (displayedText.length > 0) {
        const delay = backspaceSpeedBase + (Math.random() * 18 - 9);
        timeoutRef.current = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, Math.max(20, delay));
      } else {
        // Completely cleared
        setPhase('waiting');
      }
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    // Phase 5: Brief pause before starting next sentence
    if (phase === 'waiting') {
      timeoutRef.current = setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % activeMessages.length);
        setPhase('typing');
      }, pauseBeforeNextMs);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [
    phase,
    displayedText,
    currentMessageIndex,
    activeMessages,
    typingSpeedBase,
    backspaceSpeedBase,
    pauseBeforeDeleteMs,
    pauseBeforeNextMs,
    disableAnimation,
  ]);

  return (
    <span className={`inline-flex items-center justify-center font-semibold tracking-tight ${className}`}>
      <span>{displayedText}</span>
      <span
        aria-hidden="true"
        className="inline-block w-[3px] sm:w-[3.5px] h-[0.9em] ml-1 sm:ml-1.5 rounded-full align-middle animate-pulse"
        style={{
          backgroundColor: cursorColor,
          boxShadow: `0 0 8px ${cursorColor}`,
        }}
      />
    </span>
  );
};
