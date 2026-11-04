export interface MealSlot {
  id: string;
  date: string; // ISO date 'YYYY-MM-DD'
  starts_at: string; // 'HH:MM'
  ends_at: string; // 'HH:MM'
  // created_by: string; // user UUID
  created_at?: string;
}
