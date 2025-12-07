import { Grade, createDeck } from 'femto-fsrs';

export interface Card {
  question: string;
  answer: string;
  // FSRS data (optional for new cards)
  D?: number;    // difficulty  
  S?: number;    // stability
  I?: number;    // interval (days until next review)
}

const { newCard, gradeCard: gradeCardFSRS } = createDeck();

export function parseTSV(tsvText: string): Card[] {
  if (!tsvText || typeof tsvText !== 'string') {
    return [];
  }
  const lines = tsvText.trim().split('\n').filter(line => line && typeof line === 'string' && line.trim());
  if (lines.length === 0) return [];
  
  // Skip header line if present
  const dataLines = lines[0].includes('\t') && 
    (lines[0].toLowerCase().includes('question') || lines[0].toLowerCase().includes('вопрос'))
    ? lines.slice(1) 
    : lines;
  
  return dataLines.map(line => {
    const parts = line.split('\t');
    const question = parts[0] || '';
    const answer = parts[1] || '';
    
    // Parse FSRS metadata if present
    if (parts.length >= 5 && parts[2] && parts[3] && parts[4]) {
      return {
        question,
        answer,
        D: parseFloat(parts[2]),
        S: parseFloat(parts[3]),
        I: parseFloat(parts[4]),
      };
    }
    
    // New card without FSRS data
    return { question, answer };
  });
}

export function stringifyTSV(cards: Card[]): string {
  const header = 'question\tanswer\tD\tS\tI';
  
  const lines = cards.map(card => {
    const parts = [
      card.question,
      card.answer,
      card.D?.toString() || '',
      card.S?.toString() || '',
      card.I?.toString() || '',
    ];
    return parts.join('\t');
  });
  
  return [header, ...lines].join('\n');
}

export function getCardsForReview(cards: Card[]): Card[] {
  return cards.filter(card => {
    // New cards (no FSRS data)
    if (!card.I) return true;
    
    // Cards due for review (I is in days)
    // Assuming cards were last reviewed when they got their I value
    // For simplicity, we'll consider all cards with I data as potentially reviewable
    return true;
  });
}

export function gradeCard(card: Card, rating: 'again' | 'hard' | 'good' | 'easy'): Card {
  const gradeMap = {
    'again': Grade.AGAIN,
    'hard': Grade.HARD,
    'good': Grade.GOOD,
    'easy': Grade.EASY
  };
  
  let fsrsCard;
  
  if (card.D !== undefined && card.S !== undefined && card.I !== undefined) {
    // Existing card - reconstruct FSRS card
    fsrsCard = {
      D: card.D,
      S: card.S,
      I: card.I
    };
  } else {
    // New card
    fsrsCard = newCard(Grade.GOOD);
  }
  
  // Process with FSRS
  const daysSinceReview = 1; // Assume 1 day for simplicity
  const newFSRSCard = gradeCardFSRS(fsrsCard, daysSinceReview, gradeMap[rating]);
  
  // Return updated card
  return {
    question: card.question,
    answer: card.answer,
    D: newFSRSCard.D,
    S: newFSRSCard.S,
    I: newFSRSCard.I,
  };
}