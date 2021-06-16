const { admin } = require('../adminApp');

/**
 * Registers user to firebase
 * @param {Req Obj} reqest object
 * @param {Res Obj} response object
 * @return {JSON Obj} json res object
 */
const register = async (request, response) => {
  try {
    const userData = request.body;
    console.log(userData);
    let user = await admin.auth().createUser(userData);
    let res = await admin.firestore().collection('users').doc(user.uid).set({
      displayName: userData.displayName,
      email: userData.email,
      uid: user.uid,
      address: '',
      chargers: [],
    });
    console.log('res =', res);
    return response.json({ success: true, user });
  } catch (error) {
    console.log(error);
    return response.status(401).json({ success: false, error: error.message });
  }
};

const updateAccount = async (request, response) => {
  const { uid } = request;
  try {
    const userData = request.body;
    console.log(userData);
    let user = await admin.auth().updateUser(uid, userData);
    let fireStoreUser = await admin
      .firestore()
      .collection('users')
      .doc(uid)
      .update(userData);
    return response.status(200).json({ success: true, user: user.toJSON() });
  } catch (error) {
    console.log(error);
    return response.status(401).json({ success: false, error: error.message });
  }
};

const generateApiKey = async (request, response) => {
  const { uid } = request;
  console.log(uid);
  const key = await admin.firestore().collection('test').doc().id;

  // console.log(key);
  await admin.firestore().collection('users').doc(uid).update({ apiKey: key });
  return key;
};

module.exports = {
  register,
  updateAccount,
  generateApiKey,
};
