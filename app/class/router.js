module.exports = (app, handlers, upload) => {
  app.register((instance, opts, next) => {
      instance.get('calendars', {
        schema: {
          description: 'Récupérer tous les calendriers',
          tags: ['Calendrier'],
          response: {
            200: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                }
              }
            }
          }
        }
      }
      ,handlers.getAllCalendars);

      instance.get('calendar/:id', handlers.getCalendarById);

      instance.put('calendar/:id', handlers.updateEventCalendar);
      instance.post('calendar', { preHandler: upload.single('file') }, handlers.submitCalendar);

      instance.delete('calendar/:id', handlers.removeCalendar)

      instance.post('calendar/temporary', handlers.getTemporaryCalendar);

      //route fastify with PROPFIND method
      instance.route({
          method: 'PROPFIND',
          url: 'calendar/:id',
          handler: handlers.propfindCalendar  
      });

      instance.post('login', handlers.login);

      instance.post('logout', handlers.logout);


      next();
  }, { prefix: '/api/v1/' });

  
  //app.get('/', handlers.getLogin); //login
  app.get('/users/:id/dashboard', handlers.getDashboard); // Création d'un calendrier
  app.get('/calendars/:id', handlers.getWebCalendarById); // visualisation du calendrier if public
  app.get('/calendars', handlers.getWebCalendarById); // Visualisation du calendrier vide
  app.get('/logout', handlers.getLogout);

  app.post('/users/:id/calendars', handlers.createUserCalendar); // créer un calendrier pour l'utilisateur
  app.get('/users/:id/calendars', handlers.getUserCalendars); // voir les calendriers de l'utilisateur
  app.get('/users/:id/calendars/:calendarId', handlers.getUserCalendarById); // voir un calendrier de l'utilisateur
  app.put('/users/:id/calendars/:calendarId', handlers.updateUserCalendar); // modifier un calendrier de l'utilisateur
  app.get('/users/:id/calendars/:calendarId/events', handlers.getUserCalendarEvents); // voir les événements d'un calendrier de l'utilisateur // format liste
  app.put('/users/:id/calendars/:calendarId/events', handlers.updateUserCalendarEvents); // modifier les événements d'un calendrier de l'utilisateur
  app.get('/users/:id/calendars/:calendarId/events/:eventId', handlers.getUserCalendarEventById); // voir un événement d'un calendrier de l'utilisateur
  app.post('/users/:id/calendars/:calendarId/import', { preHandler: upload.single('file') }, handlers.importUserCalendar); // importer un calendrier pour l'utilisateur
  app.post('/users/:id/calendars/:calendarId/subscribe', handlers.subscribeUserCalendar); // s'abonner à un calendrier
  app.post('/users/:id/calendars/:calendarId/unsubscribe', handlers.unsubscribeUserCalendar); // se désabonner à un calendrier
  app.get('/users', handlers.getUsers); // voir les utilisateurs
};