module.exports = (app, handlers, upload) => {
  app.register((instance, opts, next) => {
      instance.get('/calendars/', handlers.getCalendars);
      instance.get('/calendar/:id', handlers.getCalendarById);

      instance.post('/calendar/:id', handlers.updateCalendar);
      instance.post('/calendar', { preHandler: upload.single('file') }, handlers.submitCalendar);
      next();
  }, { prefix: '/api/v1' });

  app.get('/', handlers.getHome);
};
