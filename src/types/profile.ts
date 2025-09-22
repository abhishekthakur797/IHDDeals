export interface Profile {
  id: string;
  name: string;
  email: string;
  username: string;
  profile_picture?: string | null;
  dob?: string | null;
  sex?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  name?: string;
  username?: string;
  profile_picture?: string | null;
  dob?: string | null;
  sex?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
}