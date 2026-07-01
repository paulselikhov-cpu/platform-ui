export interface IAuthResponse {
  token: string;
  username: string;
  email: string;
  userId: number;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
}