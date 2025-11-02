import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    profileImage: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/users/me');
      setProfile(response.data);
      setImagePreview(response.data.profileImage || '');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadProfileImage = async () => {
    if (!imageFile) return profile.profileImage;

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await api.post('/api/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let profileImageKey = profile.profileImage;
      if (imageFile) {
        profileImageKey = await uploadProfileImage();
      }

      await api.put('/api/users/me', {
        name: profile.name,
        bio: profile.bio,
        profileImage: profileImageKey,
      });

      toast.success('Profile updated successfully!');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Profile Settings
        </h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          {/* Profile Image */}
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="h-32 w-32 rounded-full object-cover border-4 border-primary-500"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-4xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  dark:file:bg-primary-900 dark:file:text-primary-300
                  hover:file:bg-primary-100 dark:hover:file:bg-primary-800
                  cursor-pointer"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={fetchProfile}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg
                hover:from-primary-700 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
