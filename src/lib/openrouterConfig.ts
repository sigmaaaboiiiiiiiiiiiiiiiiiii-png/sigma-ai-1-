/**
 * OpenRouter API Configuration & Comprehensive Free Models Catalog
 *
 * Configured with:
 * - OpenRouter API Key: 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
 * - Base URL: https://openrouter.ai/api/v1
 * - Smart Automatic Free Model Pool: openrouter/free
 *   (dynamically routes requests across high-performance, zero-cost free models)
 */

const rawViteKey = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENROUTER_API_KEY : '';
export const OPENROUTER_API_KEY =
  (rawViteKey && !rawViteKey.includes('5aa2093'))
    ? rawViteKey
    : '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';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const OPENROUTER_CHAT_ENDPOINT = `${OPENROUTER_BASE_URL}/chat/completions`;

/**
 * OpenRouter's smart automatic free pool ("openrouter/free").
 * Dynamically handles multi-model fallback across all active zero-cost models.
 */
export const OPENROUTER_FREE_MODEL = 'openrouter/free';

export interface OpenRouterFreeModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  description: string;
  supportsVision?: boolean;
}

/**
 * Complete catalog of all active zero-cost free models on OpenRouter.
 */
export const OPENROUTER_ALL_FREE_MODELS: OpenRouterFreeModelInfo[] = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Pool (Auto Smart Routing)',
    provider: 'OpenRouter',
    contextWindow: 128000,
    description: 'Dynamic intelligent routing across all available zero-cost free models with instant fallback.',
    supportsVision: true,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 Lightning (Free)',
    provider: 'NVIDIA',
    contextWindow: 128000,
    description: 'Ultra-fast sub-second synthetic reasoning, math, and structured instruction following.',
    supportsVision: false,
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B IT (Free)',
    provider: 'Google',
    contextWindow: 131072,
    description: 'Google advanced high-parameter open model with deep reasoning and multilingual abilities.',
    supportsVision: false,
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google Gemma 4 26B A4B (Free)',
    provider: 'Google',
    contextWindow: 131072,
    description: 'Google efficient architecture tuned for agile reasoning and fast generative tasks.',
    supportsVision: false,
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA Nemotron 3 Ultra 550B (Free)',
    provider: 'NVIDIA',
    contextWindow: 128000,
    description: 'Massive enterprise scale foundation model for complex logic and analytical depth.',
    supportsVision: false,
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA Nemotron 3 Nano Omni (Free)',
    provider: 'NVIDIA',
    contextWindow: 65536,
    description: 'Omni reasoning model specialized in step-by-step problem solving and chain of thought.',
    supportsVision: false,
  },
  {
    id: 'nvidia/nemotron-3.5-super-vl:free',
    name: 'NVIDIA Nemotron 3.5 Super VL (Free)',
    provider: 'NVIDIA',
    contextWindow: 128000,
    description: 'Vision-language multimodal model for visual understanding and image analysis.',
    supportsVision: true,
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code (Free)',
    provider: 'Cohere',
    contextWindow: 32768,
    description: 'Cohere optimized code generation, refactoring, and concise programming solutions.',
    supportsVision: false,
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'LiquidAI LFM 2.5 2.6B (Free)',
    provider: 'LiquidAI',
    contextWindow: 32768,
    description: 'Liquid Neural Network architecture for lightning-fast lightweight conversations.',
    supportsVision: false,
  },
  {
    id: 'liquid/lfm-3-1.7b:free',
    name: 'LiquidAI LFM 3 1.7B (Free)',
    provider: 'LiquidAI',
    contextWindow: 32768,
    description: 'Ultra-compact high-speed liquid neural model for instant responses.',
    supportsVision: false,
  },
  {
    id: 'thinkingmachines/inkling-2-small:free',
    name: 'Thinking Machines Inkling 2 Small (Free)',
    provider: 'Thinking Machines',
    contextWindow: 32768,
    description: 'Lightweight versatile assistant model for creative writing and dialogue.',
    supportsVision: false,
  },
  {
    id: 'recursive/flint-v1.0:free',
    name: 'Recursive Flint v1.0 (Free)',
    provider: 'Recursive',
    contextWindow: 32768,
    description: 'Specialized recursive synthesis and structured information extraction.',
    supportsVision: false,
  },
  {
    id: 'xingchen-agi/xing4.0-29b-a4b:free',
    name: 'XingChen 4.0 29B (Free)',
    provider: 'XingChen AGI',
    contextWindow: 32768,
    description: 'High-capacity multilingual model with strong cross-domain instruction following.',
    supportsVision: false,
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots Studio Dots-3 Note Preview (Free)',
    provider: 'Dots Studio',
    contextWindow: 32768,
    description: 'Structured notes, summarization, and outlining assistant.',
    supportsVision: false,
  },
];
