module.exports = (app, handlers, upload) => {
  app.register((instance, opts, next) => {
      instance.get('/calendars', handlers.getAllCalendars);

      instance.get('/calendar/:id', handlers.getCalendarById);

      instance.put('/calendar/:id', handlers.updateCalendar);
      instance.post('/calendar', { preHandler: upload.single('file') }, handlers.submitCalendar);

      instance.delete('/calendar/:id', handlers.removeCalendar)

      //route fastify with PROPFIND method
      instance.route({
          method: 'PROPFIND',
          url: '/calendar/:id',
          handler: handlers.propfindCalendar  
      });

      instance.post('/login', handlers.login);

      instance.post('/logout', handlers.logout);


      next();
  }, { prefix: '/api/v1' });

  app.get('/', handlers.getLogin); //login
  app.get('/dashboard', handlers.getDashboard); // Création d'un calendrier
  app.get('/calendars/:id', handlers.getWebCalendarById); // visualisation du calendrier if public
  app.get('/calendar', handlers.getWebCalendarById); // Visualisation du calendrier vide
  app.get('/logout', handlers.getLogout);


  app.get('/users/:id/calendars', handlers.getUserCalendars); // voir les calendriers de l'utilisateur
  app.get('/users/:id/calendars/:calendarId', handlers.getUserCalendarById); // voir un calendrier de l'utilisateur
  app.get('/users/:id/calendars/:calendarId/events', handlers.getUserCalendarEvents); // voir les événements d'un calendrier de l'utilisateur // format liste
  app.get('/users/:id/calendars/:calendarId/events/:eventId', handlers.getUserCalendarEventById); // voir un événement d'un calendrier de l'utilisateur
};