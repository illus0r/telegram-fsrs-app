// FSRS logic and TSV parser
import { FSRS, Card, Rating, State, createEmptyCard, generatorParameters } from 'ts-fsrs';

export { State } from 'ts-fsrs';
export type Grade = Rating;

export interface CardData {
  question: string;
  answer: string;
  card: Card;
}

export interface StudySession {
  card: CardData;
  showAnswer: boolean;
}

export const Grade = {
  Again: 1 as Rating,
  Hard: 2 as Rating,
  Good: 3 as Rating,
  Easy: 4 as Rating,
} as const;

export class FSRSManager {
  private fsrs: FSRS;
  private cards: CardData[] = [];

  constructor() {
    // Initialize FSRS with default parameters
    this.fsrs = new FSRS(generatorParameters());
  }

  // TSV parsing and serialization
  parseTSV(tsvData: string): CardData[] {
    const lines = tsvData.trim().split('\n');
    if (lines.length <= 1) return []; // Need at least header + 1 data line

    const cards: CardData[] = [];

    // Skip first line (header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split('\t');
      if (columns.length < 2) continue;

      const question = columns[0] || '';
      const answer = columns[1] || '';

      // Parse FSRS fields (if available)
      const due = columns[2] ? new Date(columns[2]) : new Date();
      const stability = parseFloat(columns[3]) || 0;
      const difficulty = parseFloat(columns[4]) || 0;
      const elapsedDays = parseInt(columns[5]) || 0;
      const scheduledDays = parseInt(columns[6]) || 0;
      const reps = parseInt(columns[7]) || 0;
      const lapses = parseInt(columns[8]) || 0;
      const state = parseInt(columns[9]) || State.New;
      const lastReview = columns[10] ? new Date(columns[10]) : undefined;

      let card: Card;
      if (stability === 0 && difficulty === 0 && reps === 0) {
        // New card
        card = createEmptyCard();
      } else {
        // Existing card with FSRS data
        card = {
          due,
          stability,
          difficulty,
          elapsed_days: elapsedDays,
          scheduled_days: scheduledDays,
          reps,
          lapses,
          state,
          last_review: lastReview,
        };
      }

      cards.push({
        question,
        answer,
        card,
      });
    }

    return cards;
  }

  serializeTSV(cards: CardData[]): string {
    // Always include header
    const header = 'question\tanswer\tdue\tstability\tdifficulty\telapsed_days\tscheduled_days\treps\tlapses\tstate\tlast_review';
    
    if (cards.length === 0) return header;

    const lines = cards.map(({ question, answer, card }) => {
      return [
        question,
        answer,
        card.due.toISOString(),
        card.stability.toString(),
        card.difficulty.toString(),
        card.elapsed_days.toString(),
        card.scheduled_days.toString(),
        card.reps.toString(),
        card.lapses.toString(),
        card.state.toString(),
        card.last_review?.toISOString() || '',
      ].join('\t');
    });

    return [header, ...lines].join('\n');
  }

  // Load cards from TSV data
  loadCards(tsvData: string) {
    this.cards = this.parseTSV(tsvData);
    console.log(`Loaded ${this.cards.length} cards`);
  }

  // Get all cards as TSV
  exportTSV(): string {
    return this.serializeTSV(this.cards);
  }

  // Get cards due for review
  getDueCards(): CardData[] {
    const now = new Date();
    return this.cards.filter(cardData => cardData.card.due <= now);
  }

  // Get next card for study
  getNextCard(): CardData | null {
    const dueCards = this.getDueCards();
    if (dueCards.length === 0) return null;
    
    // Sort by due date (earliest first)
    dueCards.sort((a, b) => a.card.due.getTime() - b.card.due.getTime());
    return dueCards[0];
  }

  // Get scheduling info for a card (for showing next review times)
  getSchedulingInfo(cardData: CardData) {
    const now = new Date();
    try {
      const schedulingInfo = this.fsrs.repeat(cardData.card, now);
      
      // ts-fsrs 3.5 returns an object with keys as numbers
      // Convert due dates to Date objects
      return {
        again: {
          ...schedulingInfo[1],
          card: {
            ...schedulingInfo[1].card,
            due: new Date(schedulingInfo[1].card.due)
          }
        },
        hard: {
          ...schedulingInfo[2],
          card: {
            ...schedulingInfo[2].card,
            due: new Date(schedulingInfo[2].card.due)
          }
        },
        good: {
          ...schedulingInfo[3],
          card: {
            ...schedulingInfo[3].card,
            due: new Date(schedulingInfo[3].card.due)
          }
        },
        easy: {
          ...schedulingInfo[4],
          card: {
            ...schedulingInfo[4].card,
            due: new Date(schedulingInfo[4].card.due)
          }
        },
      };
    } catch (error) {
      console.error('Error getting scheduling info:', error);
      return null;
    }
  }

  // Review a card
  reviewCard(cardData: CardData, grade: Rating): CardData {
    const now = new Date();
    const schedulingInfo = this.fsrs.repeat(cardData.card, now);
    
    let updatedCard: Card;
    switch (grade) {
      case 1: // Again
        updatedCard = schedulingInfo[1].card;
        break;
      case 2: // Hard
        updatedCard = schedulingInfo[2].card;
        break;
      case 3: // Good
        updatedCard = schedulingInfo[3].card;
        break;
      case 4: // Easy
        updatedCard = schedulingInfo[4].card;
        break;
      default:
        updatedCard = schedulingInfo[3].card;
    }

    // Update the card in our collection
    const cardIndex = this.cards.findIndex(c => c === cardData);
    if (cardIndex !== -1) {
      this.cards[cardIndex] = {
        ...cardData,
        card: updatedCard,
      };
      return this.cards[cardIndex];
    }

    return { ...cardData, card: updatedCard };
  }

  // Add a new card
  addCard(question: string, answer: string): CardData {
    const newCard: CardData = {
      question,
      answer,
      card: createEmptyCard(),
    };
    
    this.cards.push(newCard);
    return newCard;
  }

  // Remove a card
  removeCard(cardData: CardData) {
    const index = this.cards.findIndex(c => c === cardData);
    if (index !== -1) {
      this.cards.splice(index, 1);
    }
  }

  // Get stats
  getStats() {
    const now = new Date();
    const due = this.cards.filter(c => c.card.due <= now).length;
    const new_ = this.cards.filter(c => c.card.state === State.New).length;
    const learning = this.cards.filter(c => c.card.state === State.Learning || c.card.state === State.Relearning).length;
    const review = this.cards.filter(c => c.card.state === State.Review).length;

    return {
      total: this.cards.length,
      due,
      new: new_,
      learning,
      review,
    };
  }

  // Get all cards
  getAllCards(): CardData[] {
    return [...this.cards];
  }

  // Clear all cards
  clearCards() {
    this.cards = [];
  }

  // Get demo cards
  static getDemoTSV(): string {
    return [
      'question\tanswer\tdue\tstability\tdifficulty\telapsed_days\tscheduled_days\treps\tlapses\tstate\tlast_review',
      'Hello\tПривет\t' + new Date().toISOString() + '\t0\t0\t0\t0\t0\t0\t0\t',
      'World\tМир\t' + new Date().toISOString() + '\t0\t0\t0\t0\t0\t0\t0\t',
      'Cat\tКот\t' + new Date().toISOString() + '\t0\t0\t0\t0\t0\t0\t0\t',
      'Dog\tСобака\t' + new Date().toISOString() + '\t0\t0\t0\t0\t0\t0\t0\t',
      'Book\tКнига\t' + new Date().toISOString() + '\t0\t0\t0\t0\t0\t0\t0\t',
    ].join('\n');
  }
}

