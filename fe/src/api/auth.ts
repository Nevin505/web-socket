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
  const { data } = await api.post<SignupResponse>("/api/auth/signup", payload);
  return data;
}

export async function signin(payload: SigninPayload): Promise<SigninResponse> {
  const { data } = await api.post<SigninResponse>("/api/auth/login", payload);
  console.log("the toekn", data.token);
  console.log("the user", data.user)
  return data;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetLink?: string;
  token?: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  email?: string;
  name?: string;
  message?: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>(
    "/api/auth/forgot-password",
    payload
  );
  return data;
}

export async function verifyResetToken(
  token: string
): Promise<VerifyResetTokenResponse> {
  const { data } = await api.get<VerifyResetTokenResponse>(
    `/api/auth/verify-reset-token/${encodeURIComponent(token)}`
  );
  return data;
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  const { data } = await api.post<ResetPasswordResponse>(
    "/api/auth/reset-password",
    payload
  );
  return data;
}
