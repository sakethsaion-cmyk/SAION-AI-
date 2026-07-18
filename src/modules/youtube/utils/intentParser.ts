import { ParsedIntent, IntentType } from '../types/youtube.types';

export type { ParsedIntent, IntentType };

type PatternRule = {
  type: IntentType;
  pattern: RegExp;
  extractQuery?: (m: RegExpMatchArray) => string;
};

const RULES: PatternRule[] = [
  {
    type: 'PLAY_SPECIFIC',
    pattern: /\bplay\b\s+(.+)/i,
    extractQuery: (m) => m[1]?.trim() ?? '',
  },
  {
    type: 'SEARCH_GENERIC',
    pattern: /\b(?:show\s+me|find|search(?:\s+for)?|look\s+up)\b\s+(.+)/i,
    extractQuery: (m) => m[1]?.trim() ?? '',
  },
  {
    type: 'PLAY_CATEGORY',
    pattern:
      /\b(?:lo[- ]?fi|chill|relaxing|funny|music|tutorial|how\s+to|workout|meditation|gaming|documentary)\b/i,
    extractQuery: () => '',
  },
  {
    type: 'OPEN_YOUTUBE',
    pattern: /\b(?:open|go\s+to|launch|visit)\s+youtube\b/i,
  },
];

export function parseIntent(rawText: string): ParsedIntent {
  const trimmed = rawText?.trim() ?? '';

  for (const rule of RULES) {
    const match = trimmed.match(rule.pattern);
    if (match) {
      const query = rule.extractQuery ? rule.extractQuery(match) : trimmed;
      return { type: rule.type, query: query || trimmed, rawText: trimmed };
    }
  }

  return { type: 'SEARCH_GENERIC', query: trimmed, rawText: trimmed };
}
