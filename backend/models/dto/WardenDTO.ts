import { UserRole } from "../../types/UserRole";
import { BaseUserDTO } from "./BaseUserDTO";

export interface WardenDTO extends BaseUserDTO {
  role: UserRole.WARDEN;
}
