const express = require('express');

module.exports = (handlers) => {
  const router = express.Router();

  router.get('/calendar', handlers.getCalendar);
  router.get('/calendars/', handlers.getCalendars);
  router.get('/calendar/:id', handlers.getCalendarById);

  return router;
};
