const admin = require('firebase-admin');
const secret = require('./secret.json');
admin.initializeApp();
const historicalAdmin = admin.initializeApp(
  {
    credential: admin.credential.cert({
      privateKey: secret.private_key,
      clientEmail: secret.client_email,
      projectId: secret.project_id,
    }),
    databaseURL: 'https://historical-database-36668.firebaseio.com',
  },
  'historical',
);
module.exports = { admin, historicalAdmin };
