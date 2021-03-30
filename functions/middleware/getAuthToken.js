const { admin } = require('../adminApp');

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
