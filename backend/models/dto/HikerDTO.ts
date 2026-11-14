import { UserRole } from "../../types/UserRole";
import { BaseUserDTO } from "./BaseUserDTO";

export interface HikerDTO extends BaseUserDTO{
  role: UserRole.HIKER;
  surname: string;
  mobile_number: string;
  notes?: string;
  emergency_contact?: string;
}
