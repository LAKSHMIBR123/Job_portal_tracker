import { createSlice } from '@reduxjs/toolkit';
import { logout } from './authSlice';

const NOTIFICATION_STORAGE_KEY = 'jobPortalNotificationPrefs';

function loadPersistedPreferences() {
  try {
    const rawValue = localStorage.getItem(NOTIFICATION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    return parsedValue && typeof parsedValue === 'object' ? parsedValue : null;
  } catch {
    return null;
  }
}

function savePersistedPreferences(state) {
  const payload = {
    readById: state.readById,
    dismissedIds: state.dismissedIds,
  };

  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(payload));
}

function clearPersistedPreferences() {
  localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
}

const persistedPreferences = loadPersistedPreferences();

const initialState = {
  items: [],
  readById: persistedPreferences?.readById || {},
  dismissedIds: Array.isArray(persistedPreferences?.dismissedIds)
    ? persistedPreferences.dismissedIds
    : [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    syncNotifications: (state, action) => {
      const incomingNotifications = Array.isArray(action.payload) ? action.payload : [];
      const visibleIds = new Set();

      state.items = incomingNotifications
        .filter((item) => item && typeof item.id === 'string' && !state.dismissedIds.includes(item.id))
        .filter((item) => {
          if (visibleIds.has(item.id)) {
            return false;
          }

          visibleIds.add(item.id);
          return true;
        })
        .map((item) => ({
          ...item,
          read: Boolean(state.readById[item.id]),
        }));

      savePersistedPreferences(state);
    },
    markNotificationRead: (state, action) => {
      const notificationId = action.payload;

      if (typeof notificationId !== 'string') {
        return;
      }

      state.readById[notificationId] = true;
      state.items = state.items.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item
      );

      savePersistedPreferences(state);
    },
    markAllNotificationsRead: (state) => {
      state.items.forEach((item) => {
        state.readById[item.id] = true;
      });
      state.items = state.items.map((item) => ({ ...item, read: true }));

      savePersistedPreferences(state);
    },
    dismissNotification: (state, action) => {
      const notificationId = action.payload;

      if (typeof notificationId !== 'string') {
        return;
      }

      if (!state.dismissedIds.includes(notificationId)) {
        state.dismissedIds.push(notificationId);
      }

      delete state.readById[notificationId];
      state.items = state.items.filter((item) => item.id !== notificationId);

      savePersistedPreferences(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.items = [];
      state.readById = {};
      state.dismissedIds = [];
      clearPersistedPreferences();
    });
  },
});

export const {
  dismissNotification,
  markAllNotificationsRead,
  markNotificationRead,
  syncNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
