import api from "../lib/axios";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface SigninPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface SignupResponse {
  message: string;
  user: AuthUser & { createdAt: string };
}

export interface SigninResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const { data } = await api.post<SignupResponse>("/auth/signup", payload);
  return data;
}

export async function signin(payload: SigninPayload): Promise<SigninResponse> {
  const { data } = await api.post<SigninResponse>("/auth/login", payload);
  return data;
}
