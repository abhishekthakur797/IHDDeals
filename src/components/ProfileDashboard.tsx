import React, { useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Camera, 
  Save, 
  X, 
  Edit3, 
  CheckCircle, 
  AlertCircle,
  Upload
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';

interface ProfileDashboardProps {
  user: User;
  onClose: () => void;
}

const ProfileDashboard: React.FC<ProfileDashboardProps> = ({ user, onClose }) => {
  const { profile, loading, error, updateProfile, uploadProfilePicture, checkUsernameAvailability } = useProfile(user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    dob: '',
    sex: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        dob: profile.dob || '',
        sex: profile.sex || ''
      });
    }
  }, [profile, isEditing]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        errors.dob = 'You must be at least 13 years old';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUsernameChange = async (username: string) => {
    setFormData(prev => ({ ...prev, username }));
    
    if (username === profile?.username) {
      setUsernameAvailable(null);
      return;
    }

    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    const result = await checkUsernameAvailability(username);
    setUsernameAvailable(result.available);
    setCheckingUsername(false);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    if (usernameAvailable === false) {
      setFormErrors(prev => ({ ...prev, username: 'Username is already taken' }));
      return;
    }

    setSaving(true);
    try {
      const updates = {
        name: formData.name.trim(),
        username: formData.username.toLowerCase().trim(),
        dob: formData.dob || null,
        sex: formData.sex || null
      };

      const result = await updateProfile(updates);
      if (result.error) {
        throw new Error(result.error);
      }

      setIsEditing(false);
      setFormErrors({});
    } catch (error: any) {
      setFormErrors({ general: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setFormErrors({ image: 'Please select an image file' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors({ image: 'Image must be less than 5MB' });
      return;
    }

    setUploadingImage(true);
    setFormErrors({});

    try {
      const result = await uploadProfilePicture(file);
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setFormErrors({ image: error.message });
    } finally {
      setUploadingImage(false);
    }
  };

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    
    const fields = [
      profile.name,
      profile.username,
      profile.profile_picture,
      profile.dob,
      profile.sex
    ];
    
    const completedFields = fields.filter(field => field && field.trim()).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Profile
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'Unable to load profile data'}
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = getProfileCompletionPercentage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Profile Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Completion */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Profile Completion
              </span>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* General Errors */}
          {formErrors.general && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          {/* Profile Picture */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mx-auto">
                {profile.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
              >
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            {formErrors.image && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{formErrors.image}</p>
            )}
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              {isEditing ? (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>
              ) : (
                <p className="py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.name}
                </p>
              )}
              {formErrors.name && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              {isEditing ? (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Choose a username"
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!checkingUsername && usernameAvailable !== null && formData.username !== profile.username && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {usernameAvailable ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  @{profile.username}
                </p>
              )}
              {formErrors.username && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{formErrors.username}</p>
              )}
              {isEditing && formData.username.length >= 3 && usernameAvailable !== null && formData.username !== profile.username && (
                <p className={`text-xs mt-1 ${usernameAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {usernameAvailable ? 'Username is available' : 'Username is already taken'}
                </p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <p className="py-3 pl-10 pr-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.email}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed from here
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
              </label>
              {isEditing ? (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              ) : (
                <p className="py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not specified'}
                </p>
              )}
              {formErrors.dob && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{formErrors.dob}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender
              </label>
              {isEditing ? (
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value as any }))}
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              ) : (
                <p className="py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.sex ? profile.sex.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormErrors({});
                    setUsernameAvailable(null);
                    setFormData({
                      name: profile.name || '',
                      username: profile.username || '',
                      dob: profile.dob || '',
                      sex: profile.sex || ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || usernameAvailable === false}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard;