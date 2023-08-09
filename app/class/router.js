module.exports = (app, handlers, upload) => {

  app.register((instance, opts, next) => {
    
    instance.addHook('onRequest', (request, reply, done) => {
      console.log(request.raw.method )
      if (request.raw.method === 'MKCALENDAR') {
        console.log('MKCALENDAR request received')
        handlers.createCalendar(request, reply);
      } else {
        done();
      }
    });

    instance.get('/calendars/', handlers.getCalendars);
    instance.get('/calendar/:id', handlers.getCalendarById);
    instance.put('/calendar/:id', handlers.updateCalendar);
    instance.post('/calendar', { preHandler: upload.single('file') }, handlers.submitCalendar);

    instance.route({
      method: 'PROPFIND',
      url: '/calendar/:id',
      handler: handlers.propfindCalendar
    });

    next();
  }, { prefix: '/api/v1' });

  app.get('/', handlers.getHome);
};
