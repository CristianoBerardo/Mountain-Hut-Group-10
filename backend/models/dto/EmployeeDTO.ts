import { UserRole } from "../../types/UserRole";
import { BaseUserDTO } from "./BaseUserDTO";

export interface EmployeeDTO extends BaseUserDTO {
  role: UserRole.EMPLOYEE
}
