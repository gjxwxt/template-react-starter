import { apiClient } from './client';
import type {
  AppShellContext,
  UpdatePasswordInput,
  UpdateProfileInput,
  UserProfile,
} from './models';

export const getCurrentShellContext = () => {
  return apiClient.get<AppShellContext>('/app/context');
};

export const updateCurrentProfile = (input: UpdateProfileInput) => {
  return apiClient.put<UserProfile, UpdateProfileInput>('/app/profile', input);
};

export const updateCurrentPassword = (input: UpdatePasswordInput) => {
  return apiClient.put<{ success: boolean }, UpdatePasswordInput>('/app/password', input);
};
