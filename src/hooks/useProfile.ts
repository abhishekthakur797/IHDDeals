import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, ProfileUpdate } from '../types/profile';

export const useProfile = (user: User | null) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user || !profile) return { error: 'No user or profile found' };

    try {
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error: any) {
      setError(error.message);
      return { data: null, error: error.message };
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user) return { error: 'No user found' };

    try {
      setError(null);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update profile with new picture URL
      const { error: updateError } = await updateProfile({
        profile_picture: publicUrl
      });

      if (updateError) throw new Error(updateError);

      return { data: publicUrl, error: null };
    } catch (error: any) {
      setError(error.message);
      return { data: null, error: error.message };
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) return { available: false, error: 'Username is required' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .neq('id', user?.id || '');

      if (error) throw error;
      return { available: data.length === 0, error: null };
    } catch (error: any) {
      return { available: false, error: error.message };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadProfilePicture,
    checkUsernameAvailability,
    refetch: fetchProfile
  };
};