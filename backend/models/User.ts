/*
    1. Define data structure for user
    2. Define the properties of the user interface
    3. Specify the types for each property
    
    Used from other levels of the application to ensure consistency and type safety
*/

export interface User {
    id: String;             // Unique identifier for the user (uuid)
    username: String;       // Unique username for the user
    password: String;       // Password for the user
    role: String;           // Role of the user
}