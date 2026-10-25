export interface UserLoginDTO {
    username: string;
    password: string;
}

export interface UserDTONoPassword {
    id: string
    username: string;
    role: string;
}

export interface UserLoginResponseDTO {
    message: string;
    token: string;
    user: UserDTONoPassword;
}