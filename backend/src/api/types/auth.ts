// src/api/types/auth.ts

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_USER';
        companyId?: string;
    };
}

export interface RegisterUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'COMPANY_ADMIN' | 'COMPANY_USER';
    companyId: string;
}

export interface ResetPasswordRequest {
    email: string;
}

export interface ChangePasswordRequest {
    token: string;
    newPassword: string;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_USER';
    companyId?: string;
}

export interface ErrorResponse {
    error: string;
}

export interface SuccessResponse {
    message: string;
    token?: string;
}

export interface UserProfileResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_USER';
    companyId?: string;
    companyName?: string;
}