import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';
import { logout } from './authSlice';

const SAVED_JOB_IDS_KEY = 'jobPortalSavedJobIds';
const APPLIED_JOB_IDS_KEY = 'jobPortalAppliedJobIds';

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

function getJobsFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload?.jobs,
    payload?.data,
    payload?.data?.jobs,
    payload?.data?.data,
    payload?.data?.data?.jobs,
    payload?.result,
    payload?.result?.jobs,
    payload?.results,
    payload?.results?.jobs,
    payload?.docs,
    payload?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function readSavedJobIds() {
  try {
    const raw = localStorage.getItem(SAVED_JOB_IDS_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function persistSavedJobIds(savedJobIds) {
  localStorage.setItem(SAVED_JOB_IDS_KEY, JSON.stringify(savedJobIds));
}

function readAppliedJobIds() {
  try {
    const raw = localStorage.getItem(APPLIED_JOB_IDS_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function persistAppliedJobIds(appliedJobIds) {
  localStorage.setItem(APPLIED_JOB_IDS_KEY, JSON.stringify(appliedJobIds));
}

function clearJobLocalState() {
  localStorage.removeItem(SAVED_JOB_IDS_KEY);
  localStorage.removeItem(APPLIED_JOB_IDS_KEY);
}

function getJobId(job) {
  return job?._id ?? job?.id ?? null;
}

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(filters).toString();
      const endpoint = query ? `/jobs?${query}` : '/jobs';

      const res = await API.get(endpoint);

      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch jobs'));
    }
  }
);

export const applyJobAsync = createAsyncThunk(
  'jobs/applyJob',
  async (jobId, { rejectWithValue }) => {
    try {
      // Import the specific applyJob function from our API service
      const { applyJob } = await import('../services/api');
      const response = await applyJob(jobId);
      return { jobId, ...response };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to apply for job'));
    }
  }
);

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    savedJobIds: readSavedJobIds(),
    appliedJobIds: readAppliedJobIds(),
    loading: false,
    error: null,
  },
  reducers: {
    markJobApplied: (state, action) => {
      const jobId = action.payload;

      if (!jobId) {
        return;
      }

      if (!state.appliedJobIds.includes(jobId)) {
        state.appliedJobIds.push(jobId);
        persistAppliedJobIds(state.appliedJobIds);
      }

      state.jobs = state.jobs.map((job) => {
        const currentId = getJobId(job);

        if (currentId !== jobId) {
          return job;
        }

        return {
          ...job,
          status: 'applied',
          applicationStatus: 'applied',
          stage: 'applied',
        };
      });
    },
    toggleJobSaved: (state, action) => {
      const jobId = action.payload;

      if (!jobId) {
        return;
      }

      const isSaved = state.savedJobIds.includes(jobId);
      state.savedJobIds = isSaved
        ? state.savedJobIds.filter((id) => id !== jobId)
        : [...state.savedJobIds, jobId];

      persistSavedJobIds(state.savedJobIds);

      state.jobs = state.jobs.map((job) => {
        const currentId = getJobId(job);

        if (currentId !== jobId) {
          return job;
        }

        return {
          ...job,
          saved: !isSaved,
        };
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.jobs = getJobsFromPayload(action.payload).map((job) => {
          const jobId = getJobId(job);
          const isApplied = jobId ? state.appliedJobIds.includes(jobId) : false;

          return {
            ...job,
            ...(isApplied
              ? {
                  status: 'applied',
                  applicationStatus: 'applied',
                  stage: 'applied',
                }
              : {}),
            saved: Boolean(job.saved) || (jobId ? state.savedJobIds.includes(jobId) : false),
          };
        });
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Failed to fetch jobs';
      })
      .addCase(applyJobAsync.fulfilled, (state, action) => {
        const { jobId } = action.payload;

        if (!state.appliedJobIds.includes(jobId)) {
          state.appliedJobIds.push(jobId);
          persistAppliedJobIds(state.appliedJobIds);
        }

        state.jobs = state.jobs.map((job) => {
          const id = getJobId(job);
          if (id === jobId) {
            return {
              ...job,
              status: 'applied',
              applicationStatus: 'applied',
              stage: 'applied',
            };
          }
          return job;
        });
      })
      .addCase(applyJobAsync.rejected, (state, action) => {
        // We handle application errors locally in the component or via a separate field
        // to avoid overwriting the general "Couldn't load jobs" error state.
      })
      .addCase(logout, (state) => {
        state.jobs = [];
        state.savedJobIds = [];
        state.appliedJobIds = [];
        state.loading = false;
        state.error = null;
        clearJobLocalState();
      });
  },
});

export const { markJobApplied, toggleJobSaved } = jobSlice.actions;
export default jobSlice.reducer;
