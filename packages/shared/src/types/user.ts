export interface User {
  id: string;
  username: string;
  name: string;
  color: string; // hex color for calendar/avatar
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}
