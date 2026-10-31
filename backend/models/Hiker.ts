import { UserRole } from "../types/UserRole";

export interface Hiker {
  id: String; // Firebase UID
  name: String;
  email: String;
  role: UserRole.HIKER;
  surname: String;
  mobileNumber: String;
  notes: String | null;
  emergencyContact: String | null;
}
