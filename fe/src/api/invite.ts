import api from "../lib/axios";

export interface GenerateInviteInput {
  groupId: string;
  email: string;
}

export interface GeneratedInviteResponse {
  id: string;
  email: string;
  expiresAt: string;
  status: string;
  token: string;
  link: string;
  groupName?: string;
}

export interface RedeemInviteResult {
  groupId: string;
  message: string;
}

export const generateInviteApi = async (
  input: GenerateInviteInput
): Promise<GeneratedInviteResponse> => {
  const res = await api.post<{ success: boolean; invitation: GeneratedInviteResponse }>(
    "/api/invite/generate",
    input
  );
  return res.data.invitation;
};

export const redeemInviteApi = async (
  token: string
): Promise<RedeemInviteResult> => {
  const res = await api.post<{ success: boolean; result: RedeemInviteResult }>(
    "/api/invite/redem",
    { token }
  );
  return res.data.result;
};
