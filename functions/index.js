const functions = require('firebase-functions');
const server = require('./server');
/**
 * This declares that every time we get a request, it will be served under HTTP
 * and that the request will be handled by the server module
 */
const api = functions.https.onRequest(server);
module.exports = {
  api,
};
