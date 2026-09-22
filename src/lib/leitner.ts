export const MAX_BOX = 5;

/** Days until the next review for a card sitting in each Leitner box. */
export const BOX_INTERVAL_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Correct answers move a card up one box (capped at 5); wrong answers send it back to box 1.
 * The next review is scheduled using the interval of the box the card lands in.
 */
export function reviewCard(currentBox: number, correct: boolean, now = new Date()) {
  const box = correct ? Math.min(currentBox + 1, MAX_BOX) : 1;
  return {
    leitner_box: box,
    next_review_date: addDays(now, BOX_INTERVAL_DAYS[box]).toISOString(),
  };
}

/** End of the current local day, so every card scheduled for "today" counts as due. */
export function endOfToday(now = new Date()): Date {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end;
}
