/** Roles allowed to manage slots and tables (the warden can do everything an employee can). */
export const STAFF_ROLES = ["EMPLOYEE", "WARDEN"];

export function isStaff(role: string | null): boolean {
    return role !== null && STAFF_ROLES.includes(role);
}
