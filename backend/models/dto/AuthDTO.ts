/**
 * AuthDTO interface represents the data transfer object for user authentication.
 * It contains the username and password required for user login.
 */
export interface LoginDTO {
    username: string; // Unique username for the user
    password: string; // Password for the user
}