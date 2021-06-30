const { admin } = require('../adminApp');
const jwt = require('jsonwebtoken');

/**
 * Middleware. Gets auth token from client side request.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAuthToken = (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    req.authToken = req.headers.authorization.split(' ')[1];
  } else {
    req.authToken = null;
  }
  next();
};

exports.checkIfAuthenticated = (req, res, next) => {
  getAuthToken(req, res, async () => {
    try {
      const { authToken } = req;
      const userInfo = await admin.auth().verifyIdToken(authToken);
      req.uid = userInfo.uid;
      return next();
    } catch (error) {
      console.log(error.message);
      return res
        .status(401)
        .json({ error: 'You are not authorized to make this request' });
    }
  });
};

// Added by Eamon
/**
 * Middleware. Checks API Key for validity.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.checkKey = async (request, response, next) => {
  let {apiKey} = request.params;
  let wrongKey = "Invalid API Key";
  await admin.firestore().collection('apiKeys').doc(apiKey).get().then((docSnapshot) => { 
    if (docSnapshot.exists) {
      next();
      return null;
    } else {
      console.log('No such document!');
      response.status(400).json({ success: false, error: wrongKey });

    }
    return null;
  });
};

// Added by Eamon
/**
 * Middleware. Checks Token for validity.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
 exports.checkToken = async (request, response, next) => {
  let {token} = request.params;
  let {chargerId} = request.params;
  let wrongPermission = "You do not have permission to accesses this charger";
  let expiredToken = "Your Token has expired please reissue a new Token gueing the getToken call";
  var permission = false;

  var key = await admin.firestore().collection('apiTokenEncryptionKey').doc('secretToken').get('token');
  var encode = key.data().token;

  var decryptedToken = jwt.decode(token, encode);

  console.log(decryptedToken);
   var today =  await new Date();
  // console.log(today);
   var nextTime = await new Date(decryptedToken.EXPIRATION);
   if (today > nextTime) {
    console.log('Token expired!');
    response.status(400).json({ success: false, error: expiredToken });
   }

  decryptedToken.TOKEN.forEach(function(entry) {

    if (entry.chargerName === chargerId) {
      permission = true;
    }
  });

  if (permission === true) {
    next();
    return null;
  } else {
    console.log('Wrong Permission!');
    response.status(400).json({ success: false, error: wrongPermission });

  }

};
