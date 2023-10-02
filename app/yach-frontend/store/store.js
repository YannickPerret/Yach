import { configureStore } from '@reduxjs/toolkit';
import calendarReducer from './calendarSlice';
import errorReducer from './errorSlice';

export const store = configureStore({
  reducer: {
    calendars: calendarReducer,
    error: errorReducer,
  }
});
