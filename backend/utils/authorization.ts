import { InsufficientPermissionsError } from "../errors/AppError";
import { UserRole } from "../types/UserRole";

export function assertCanAccessReservation(
  hiker_id: string,
  authenticated_user_id: string,
  role: UserRole,
): void {
  // If the user is an hiker
  // He can only work on his own reservations
  if (role == UserRole.HIKER && hiker_id !== authenticated_user_id) {
    throw new InsufficientPermissionsError(
      "Only the hiker who owns this reservation can modify it.",
    );
  }
}
