import { UserRole } from "../types/UserRole";

export interface Warden {
  id: String; // db UID
  firebase_uid: String; // Firebase UID
  name: String;
  email: String;
  role: UserRole.WARDEN;
}
