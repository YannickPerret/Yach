module.exports = (app, handlers) => {
  app.register((instance, opts, next) => {
      instance.get('/calendar', handlers.getCalendar);
      instance.get('/calendars/', handlers.getCalendars);
      instance.get('/calendar/:id', handlers.getCalendarById);

      instance.post('/calendar', handlers.submitCalendar);
      next();
  }, { prefix: '/api/v1' });

  app.get('/', handlers.getHome);
};
