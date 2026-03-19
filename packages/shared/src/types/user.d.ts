export interface User {
    id: string;
    username: string;
    name: string;
    color: string;
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
//# sourceMappingURL=user.d.ts.map