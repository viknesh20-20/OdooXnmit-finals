import apiClient, { ApiResponse } from '../api';

// Auth Types
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
  message: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  private readonly basePath = '/auth';

  /**
   * Login user with username/email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: ApiResponse<{
      user: AuthUser;
      accessToken: string;
      expiresIn: number;
    }> = await apiClient.post(
      `${this.basePath}/login`,
      credentials
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Login failed');
    }

    return {
      user: response.data.user,
      accessToken: response.data.accessToken,
      expiresIn: response.data.expiresIn
    };
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response: ApiResponse<{
      user: AuthUser;
      accessToken: string;
      expiresIn: number;
      message: string;
    }> = await apiClient.post(
      `${this.basePath}/register`,
      userData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Registration failed');
    }

    return {
      user: response.data.user,
      accessToken: response.data.accessToken,
      expiresIn: response.data.expiresIn,
      message: response.data.message
    };
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
    const response: ApiResponse<{ message: string }> = await apiClient.post(
      `${this.basePath}/forgot-password`,
      request
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Forgot password request failed');
    }

    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
    const response: ApiResponse<{ message: string }> = await apiClient.post(
      `${this.basePath}/reset-password`,
      request
    );
    return response.data!;
  }

  /**
   * Refresh access token (refresh token is handled via httpOnly cookie)
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    const response: ApiResponse<RefreshTokenResponse> = await apiClient.post(
      `${this.basePath}/refresh`,
      {} // No body needed, refresh token is in httpOnly cookie
    );
    return response.data!;
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<{ valid: boolean; user?: AuthUser }> {
    try {
      const response: ApiResponse<{ user: AuthUser }> = await apiClient.get(
        `${this.basePath}/validate`
      );
      // Backend returns { success: true, data: { user: ... } }
      // Transform to expected format
      return {
        valid: true,
        user: response.data?.user
      };
    } catch (error) {
      return {
        valid: false
      };
    }
  }

  /**
   * Logout user (invalidate token)
   */
  async logout(): Promise<{ message: string }> {
    const response: ApiResponse<{ message: string }> = await apiClient.post(
      `${this.basePath}/logout`
    );
    return response.data!;
  }

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<{ message: string }> {
    const response: ApiResponse<{ message: string }> = await apiClient.post(
      `${this.basePath}/logout-all`
    );
    return response.data!;
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<any> {
    const response: ApiResponse<any> = await apiClient.get('/dashboard');
    return response.data;
  }

  /**
   * Get available roles for registration
   */
  async getRoles(): Promise<Array<{ id: string; name: string; description?: string }>> {
    // This would be a separate endpoint, for now return empty array
    // In a real implementation, this might be /api/v1/roles or similar
    return [];
  }

  /**
   * Generate username from email
   */
  generateUsername(email: string): string {
    return email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate username format
   */
  validateUsername(username: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (username.length > 50) {
      errors.push('Username must be less than 50 characters');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
