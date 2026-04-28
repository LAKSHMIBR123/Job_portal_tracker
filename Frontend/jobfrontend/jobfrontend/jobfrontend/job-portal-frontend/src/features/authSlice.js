import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';

const TOKEN_KEYS = ['token', 'accessToken', 'authToken', 'jwt'];
const USER_KEYS = ['user', 'currentUser', 'account', 'profile'];

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
  return [payload, payload?.data, payload?.result, payload?.auth].filter(
    (item) => item && typeof item === 'object'
  );
}

function buildUserFromObject(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const id = candidate._id ?? candidate.id ?? candidate.userId ?? candidate.user_id;
  const name = candidate.name ?? candidate.username ?? candidate.fullName;
  const email = candidate.email ?? candidate.userEmail;
  const role = candidate.role ?? candidate.userRole ?? 'user';

  if (!id && !name && !email && !candidate.role && !candidate.userRole) {
    return null;
  }

  return {
    ...(id ? { id } : {}),
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    role,
  };
}

function normalizeSession(payload) {
  const candidates = getCandidateObjects(payload);

  let token = null;
  for (const candidate of candidates) {
    for (const key of TOKEN_KEYS) {
      if (typeof candidate[key] === 'string' && candidate[key].trim()) {
        token = candidate[key];
        break;
      }
    }

    if (token) {
      break;
    }
  }

  let user = null;
  for (const candidate of candidates) {
    for (const key of USER_KEYS) {
      const nestedUser = buildUserFromObject(candidate[key]);

      if (nestedUser) {
        user = nestedUser;
        break;
      }
    }

    if (user) {
      break;
    }

    user = buildUserFromObject(candidate);
    if (user) {
      break;
    }
  }

  return { token, user };
}

function persistSession(state, payload, fallbackUser = null) {
  const session = normalizeSession(payload);
  const user = session.user || fallbackUser;

  if (user) {
    state.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  if (session.token) {
    state.token = session.token;
    localStorage.setItem('token', session.token);
  }
}

function persistUser(state, user) {
  if (!user) {
    return;
  }

  state.user = user;
  localStorage.setItem('user', JSON.stringify(user));
}

// REGISTER — no JWT returned; saves pendingEmail for /verify-email page
export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/register', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Register failed'));
    }
  }
);

// LOGIN
export const loginUser = createAsyncThunk(
  'auth/login',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/login', formData);
      const responseData = response.data;
      const session = normalizeSession(responseData);

      if (!session.token) {
        return rejectWithValue('Login failed: no authentication token was returned.');
      }

      return responseData;
    } catch (error) {
      // Preserve the full response data so EMAIL_NOT_VERIFIED code reaches the UI
      const responseData = error.response?.data;
      if (responseData?.code === 'EMAIL_NOT_VERIFIED') {
        return rejectWithValue(responseData);
      }
      return rejectWithValue(getErrorMessage(error, 'Login failed'));
    }
  }
);

// VERIFY OTP
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      const responseData = error.response?.data;
      return rejectWithValue(
        responseData?.message || getErrorMessage(error, 'Verification failed')
      );
    }
  }
);

// RESEND OTP
export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error) {
      const responseData = error.response?.data;
      return rejectWithValue(
        responseData?.message || getErrorMessage(error, 'Resend failed')
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    pendingEmail: localStorage.getItem('pendingEmail') || null,
    loading: false,
    otpLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.pendingEmail = null;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('pendingEmail');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    syncAuthUser: (state, action) => {
      const payload = action.payload;

      if (!payload || typeof payload !== 'object') {
        return;
      }

      persistUser(state, {
        ...(state.user || {}),
        ...payload,
        role: payload.role ?? state.user?.role ?? 'user',
      });
    },
    clearPendingEmail: (state) => {
      state.pendingEmail = null;
      localStorage.removeItem('pendingEmail');
    },
  },
  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // No JWT — just save the email so the verify page knows who to verify
        const email = action.payload?.data?.email || action.meta.arg.email;
        if (email) {
          state.pendingEmail = email;
          localStorage.setItem('pendingEmail', email);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Register failed';
      })

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.pendingEmail = null;
        localStorage.removeItem('pendingEmail');
        persistSession(state, action.payload, {
          email: action.meta.arg.email,
          role: 'user',
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        // Store the full object if it's EMAIL_NOT_VERIFIED so Login can read the code
        state.error = action.payload || action.error?.message || 'Login failed';
      })

      // VERIFY OTP
      .addCase(verifyOtp.pending, (state) => {
        state.otpLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.otpLoading = false;
        state.error = null;
        state.pendingEmail = null;
        localStorage.removeItem('pendingEmail');
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.error = action.payload || 'Verification failed';
      })

      // RESEND OTP
      .addCase(resendOtp.pending, (state) => {
        state.otpLoading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.otpLoading = false;
        state.error = null;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.error = action.payload || 'Resend failed';
      });
  },
});

export const { logout, clearAuthError, syncAuthUser, clearPendingEmail } = authSlice.actions;
export default authSlice.reducer;
