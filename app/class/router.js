module.exports = (app, handlers, upload) => {
  app.register((instance, opts, next) => {
      instance.get('/calendars/', handlers.getCalendars);
      instance.get('/calendar/:id', handlers.getCalendarById);

      instance.put('/calendar/:id', handlers.updateCalendar);
      instance.post('/calendar', { preHandler: upload.single('file') }, handlers.submitCalendar);

      //route fastify with PROPFIND method
      instance.route({
          method: 'PROPFIND',
          url: '/calendar/:id',
          handler: handlers.propfindCalendar  
      });

      next();
  }, { prefix: '/api/v1' });

  app.get('/', handlers.getHome);
};