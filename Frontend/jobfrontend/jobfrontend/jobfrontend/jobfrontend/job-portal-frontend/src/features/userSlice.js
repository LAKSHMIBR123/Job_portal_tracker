import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';

function getErrorMessage(error, fallbackMessage) {
  const responseData = error.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    return responseData.error;
  }

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    return responseData.errors
      .map((item) => item?.msg || item?.message || item)
      .filter(Boolean)
      .join(', ');
  }

  return error.message || fallbackMessage;
}

function getCandidateObjects(payload) {
  return [
    payload,
    payload?.user,
    payload?.profile,
    payload?.data,
    payload?.data?.user,
    payload?.data?.profile,
    payload?.result,
    payload?.result?.user,
    payload?.result?.profile,
  ].filter((item) => item && typeof item === 'object');
}

function buildProfileFromObject(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const profile = {
    ...(candidate._id || candidate.id || candidate.userId || candidate.user_id
      ? {
          id:
            candidate._id ?? candidate.id ?? candidate.userId ?? candidate.user_id,
        }
      : {}),
    ...(candidate.name || candidate.fullName || candidate.username
      ? {
          name: candidate.name ?? candidate.fullName ?? candidate.username,
        }
      : {}),
    ...(candidate.email || candidate.userEmail
      ? {
          email: candidate.email ?? candidate.userEmail,
        }
      : {}),
    ...(candidate.phone || candidate.mobile || candidate.contactNumber
      ? {
          phone: candidate.phone ?? candidate.mobile ?? candidate.contactNumber,
        }
      : {}),
    ...(candidate.location || candidate.address || candidate.city
      ? {
          location: candidate.location ?? candidate.address ?? candidate.city,
        }
      : {}),
    ...(candidate.headline || candidate.title || candidate.position
      ? {
          headline: candidate.headline ?? candidate.title ?? candidate.position,
        }
      : {}),
    ...(candidate.bio || candidate.summary || candidate.about
      ? {
          bio: candidate.bio ?? candidate.summary ?? candidate.about,
        }
      : {}),
    ...(candidate.role || candidate.userRole
      ? {
          role: candidate.role ?? candidate.userRole,
        }
      : {}),
  };

  return Object.keys(profile).length > 0 ? profile : null;
}

function normalizeProfile(payload) {
  const candidates = getCandidateObjects(payload);

  for (const candidate of candidates) {
    const profile = buildProfileFromObject(candidate);

    if (profile) {
      return profile;
    }
  }

  return null;
}

function getSuccessMessage(payload, fallbackMessage) {
  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload?.data?.message === 'string' && payload.data.message.trim()) {
    return payload.data.message;
  }

  return fallbackMessage;
}

// GET PROFILE
export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/user/profile');

      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch profile'));
    }
  }
);

// UPDATE PROFILE
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await API.put('/user/profile', formData);

      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update profile'));
    }
  }
);

// CHANGE PASSWORD
export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await API.put('/user/change-password', formData);

      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to change password'));
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    loading: false,
    success: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // GET PROFILE
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.profile = normalizeProfile(action.payload) || state.profile;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || 'Failed to fetch profile';
      })

      // UPDATE PROFILE
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.success = null;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.profile = normalizeProfile(action.payload) || {
          ...(state.profile || {}),
          ...action.meta.arg,
        };
        state.success = getSuccessMessage(action.payload, 'Profile updated');
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || 'Failed to update profile';
      })

      // CHANGE PASSWORD
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.success = null;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        state.success = 'Password changed';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || 'Failed to change password';
      });
  },
});

export default userSlice.reducer;
