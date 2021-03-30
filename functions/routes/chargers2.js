const admin = require('../adminApp');

const addCharger = async (req, res) => {
  try {
    // returns logged in user from middleware
    const user = req.user;
    const newCharger = req.chargerId;
    let res = await admin
      .firestore()
      .collection('users')
      .where('uid', '==', user.id)
      .update({
        chargers: admin.firestore.FieldValue.arrayUnion(newCharger),
      });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  addCharger,
};
