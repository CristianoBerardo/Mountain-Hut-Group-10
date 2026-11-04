export interface UserLoginDTO {
    username: string;
    password: string;
}

export interface UserDTONoPassword {
    id: string;
    name: string;
    surname: string;
    email: string;
    mobileNumber: string;
    notes: string | null;
    emergencyContact: string | null;
    role: string;
}

export interface UserLoginResponseDTO {
    message: string;
    token: string;
    user: UserDTONoPassword;
}

export interface UserRegisterDTO {
    name: string;
    surname: string;
    email: string;
    mobile_number: string;
    notes?: string;
    emergency_contact?: string;
}