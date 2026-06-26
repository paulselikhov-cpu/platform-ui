export interface IUser {
  id?: number;                    // Long -> number
  username: string;               // String
  password: string;               // String
  email: string;                 // String
  createdAt?: string;            // LocalDateTime -> ISO string
}