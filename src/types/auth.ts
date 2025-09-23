export interface User {
  id: string;
  full_name: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface UserRegistration {
  full_name: string;
  email: string;
  username: string;
  password: string;
}

export interface UserLogin {
  emailOrUsername: string;
  password: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string;
    username: string;
  };
}

export interface CreatePost {
  title: string;
  content: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}