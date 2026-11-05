/**
 * Which user roles may use each feature. Single source of truth for routes, Home and Navbar.
 * Values match the backend's UserRole enum.
 */

/** MH-01: booking a table is for hikers only (for now). */
export const BOOK_TABLE_ROLES = ["HIKER"];

/** MH-02: managing meal slots and tables is for employees only (for now). */
export const MANAGE_SLOTS_ROLES = ["EMPLOYEE"];

export function canBookTable(role: string | null): boolean {
    return role !== null && BOOK_TABLE_ROLES.includes(role);
}

export function canManageSlots(role: string | null): boolean {
    return role !== null && MANAGE_SLOTS_ROLES.includes(role);
}
