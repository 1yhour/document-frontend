export type AppRole = 'admin' | 'user';

export type AppPermission =
  | 'convert documents'
  | 'download converted files'
  | 'view own dashboard'
  | 'view all users';

export interface User {
  id: number | string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredential {
  email: string;
  password: string;
}

export interface RegisterCredential {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export interface ApiValidationError {
  message: string;
  errors?: Record<string, string[]>;
}
