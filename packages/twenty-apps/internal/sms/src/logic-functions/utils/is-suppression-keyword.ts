const SUPPRESSION_KEYWORDS = new Set(['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END']);

export const isSuppressionKeyword = (message: string): boolean =>
  SUPPRESSION_KEYWORDS.has(message.trim().toLocaleUpperCase('en-US'));
