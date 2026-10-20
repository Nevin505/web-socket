import api from "../lib/axios";
import type { Group } from "../types/group";

export interface CreateGroupInput {
  name: string;
  maxMembers?: number;
}

export interface CreateGroupResponse {
  message: string;
  group?: Group;
}

export const createGroupApi = async (input: CreateGroupInput): Promise<CreateGroupResponse> => {
  const res = await api.post<CreateGroupResponse>("/api/groups", input);
  return res.data;
};

export const getMyGroupsApi = async (): Promise<Group[]> => {
  const res = await api.get<{ success: boolean; groups: Group[] }>("/api/groups");
  return res.data.groups;
};

export const getGroupDetailsApi = async (id: string): Promise<Group> => {
  const res = await api.get<{ success: boolean; group: Group }>(`/api/groups/${id}`);
  return res.data.group;
};
