function fastifyWebdav(fastify, opts, next) {
    fastify.addHook('onRequest', (request, reply, done) => {
      if (request.headers['x-report-request'] === 'true') {

        console.log("REPORT request received");
        request.reportHandler(request, reply)
      } else {
        done();
      }
    });
  
    fastify.decorateRequest('reportHandler', null);
    
    next();
}

module.exports = fastifyWebdav;
