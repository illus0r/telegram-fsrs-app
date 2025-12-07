import { saveToCloud, loadFromCloud } from './telegram';

const CARDS_KEY = 'cards';

export async function saveCards(tsvData: string): Promise<void> {
  await saveToCloud(CARDS_KEY, tsvData);
}

export async function loadCards(): Promise<string> {
  return await loadFromCloud(CARDS_KEY);
}