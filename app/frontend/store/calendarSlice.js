import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const loadAllUserCalendars = createAsyncThunk(
  "calendars/loadAll",
  async (username) => {
    return await fetch(`http://localhost:3000/users/${username}/calendars`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        return data.calendars;
      });
  }
);

export const loadTemporaryCalendar = createAsyncThunk(
  "calendars/loadTemporary",
  async ({ calendarURL, calendarName }) => {
    const response = await fetch(
      `http://localhost:3000/api/v1/calendar/temporary`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: calendarURL, name: calendarName }),
      }
    );
    const data = await response.json();
    return data;
  }
);

export const updateUserCalendarAsync = createAsyncThunk(
  "calendars/updateUserCalendar",
  async (data) => {
    const response = await fetch(
      `http://localhost:3000/users/${data.username}/calendars/${data.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calendar: data }),
      }
    );
    const updatedCalendar = await response.json();
    return updatedCalendar;
  }
);

export const updateCalendarEventAsync = createAsyncThunk(
  "calendars/updateCalendarEvent",
  async (data) => {
    await fetch(
      `http://localhost:3000/users/${data.username}/calendars/${data.calendarId}/events`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: Object.values(data.events) }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        return data;
      });
  }
);

export const removeCalendarAsync = createAsyncThunk(
  "calendars/removeCalendar",
  async (data) => {
    console.log(data.calendarId);
    await fetch(`http://localhost:3000/api/v1/calendar/${data.calendarId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => response.json());
  }
);

export const calendarSlice = createSlice({
  name: "calendars",
  initialState: {
    userCalendars: [],
    temporaryCalendars: [],
    selectedCalendar: null,
    calendarView: "dayGridMonth",
  },
  reducers: {
    addUserCalendar: (state, action) => {
      state.userCalendars.push(action.payload);
    },
    removeUserCalendar: (state, action) => {
      state.userCalendars = state.userCalendars.filter(
        (calendar) => calendar.id !== action.payload.id
      );
    },
    updateUserCalendar: (state, action) => {
      const index = state.userCalendars.findIndex(
        (calendar) => calendar.id === action.payload.id
      );
      if (index !== -1) {
        state.userCalendars[index] = action.payload;
      }
    },
    updateCalendarEvents: (state, action) => {
      const calendarToUpdate = state.userCalendars.find(
        (calendar) => calendar.id === action.payload.calendarId
      );
      if (calendarToUpdate) {
        calendarToUpdate.events = action.payload.events;
      }
    },
    setSelectedCalendar: (state, action) => {
      state.selectedCalendar = action.payload;
    },
    addTemporaryCalendar: (state, action) => {
      state.temporaryCalendars.push(action.payload);
    },
    removeTemporaryCalendar: (state, action) => {
      state.temporaryCalendars = state.temporaryCalendars.filter(
        (calendar) => calendar.id !== action.payload
      );
    },

    setCalendarView: (state, action) => {
      state.calendarView = action.payload;
    },

    addEventToCalendar: (state, action) => {
      const calendarToUpdate = state.userCalendars.find(
        (calendar) => calendar.id === action.payload.calendarId
      );
      if (calendarToUpdate) {
        calendarToUpdate.events.push(action.payload.event);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAllUserCalendars.fulfilled, (state, action) => {
        state.userCalendars = action.payload;
      })

      .addCase(loadTemporaryCalendar.fulfilled, (state, action) => {
        state.temporaryCalendars.push(action.payload);
      })

      .addCase(updateUserCalendarAsync.fulfilled, (state, action) => {
        const index = state.userCalendars.findIndex(
          (calendar) => calendar.id === action.payload.id
        );
        if (index !== -1) {
          state.userCalendars[index] = action.payload;
        }
      })
      .addCase(updateCalendarEventAsync.fulfilled, (state, action) => {
        console.log(action.payload);
        const updatedCalendar = state.userCalendars.find(
          (calendar) => calendar.id === action.payload.calendarId
        );
        if (updatedCalendar) {
          updatedCalendar.events = action.payload.events;
        }
      })

      .addCase(removeCalendarAsync.fulfilled, (state, action) => {
        state.userCalendars = state.userCalendars.filter(
          (calendar) => calendar.id !== action.payload.calendarId
        );
      });
  },
});

export const {
  addUserCalendar,
  removeUserCalendar,
  updateUserCalendar,
  setSelectedCalendar,
  addTemporaryCalendar,
  removeTemporaryCalendar,
  setCalendarView,
} = calendarSlice.actions;

export const selectUserCalendars = (state) => state.calendars.userCalendars;
export const selectTemporaryCalendars = (state) =>
  state.calendars.temporaryCalendars;
export const selectSelectedCalendar = (state) =>
  state.calendars.selectedCalendar;
export const selectCalendarView = (state) => state.calendars.calendarView;

export default calendarSlice.reducer;
