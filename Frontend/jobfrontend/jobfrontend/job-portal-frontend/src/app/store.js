import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import jobReducer from '../features/jobSlice';
import notificationReducer from '../features/notificationSlice';
import testReducer from '../features/testSlice';
import userReducer from '../features/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobReducer,
    notifications: notificationReducer,
    test: testReducer,
    user: userReducer,
  },
});
