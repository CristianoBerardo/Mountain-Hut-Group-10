import { UserRole } from "../types/UserRole";

export interface Warden {
  id: String; // Firebase UID
  name: String;
  email: String;
  role: UserRole.WARDEN;
}
