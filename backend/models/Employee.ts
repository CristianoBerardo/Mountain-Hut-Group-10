import { UserRole } from "../types/UserRole";

export interface Employee {
  id: String; // Firebase UID
  name: String;
  email: String;
  role: UserRole.EMPLOYEE;
}
