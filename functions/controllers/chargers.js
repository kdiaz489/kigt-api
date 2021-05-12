const { admin, historicalAdmin } = require('../adminApp');
const { getAllocated } = require('../getAllocated');
const { format } = require('date-fns');

/**
 * @author Karen S. Diaz
 * @description Get a specific charger's data
 * @param {*} request
 * @param {*} response
 * @route  GET /api/chargers/:id
 * @access Private
 */
const getCharger = async (request, response) => {
  try {
    const { chargerId } = request.params;
    let rootSnapshot = await admin.database().ref(chargerId).once('value');
    let charger = rootSnapshot.val();

    return response.status(200).json({ charger });
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
};
/**
 * @author Karen S. Diaz
 * @description Get all of user's chargers
 * @param {*} request
 * @param {*} response
 * @route  GET /api/chargers
 * @access Private
 */
const getAllChargers = async (request, response) => {
  try {
    let chargers = [];
    const { uid } = request;

    let userSnapShot = await admin
      .firestore()
      .collection('users')
      .where('uid', '==', uid)
      .get();

    let user = userSnapShot.docs[0];
    console.log(user.data());
    let usersChargers = user.data().chargers;
    let rootSnapshot = await admin.database().ref().once('value');
    let rootObject = rootSnapshot.val();
    let keys = Object.keys(rootObject);
    for (let charger of usersChargers) {
      const { kioskId } = charger;
      if (keys.includes(kioskId)) {
        let station = rootObject[kioskId];
        chargers.push({ ...charger, charger: station });
      } else {
        chargers.push({ ...charger, charger: {} });
      }
    }

    return response.status(200).json({ chargers });
  } catch (error) {
    console.log(error.message);
    return response.status(400).json({ error: error.message });
  }
};

/**
 * @author Karen S. Diaz
 * @description Add charger to user's array of chargers
 * @param {*} request
 * @param {*} response
 * @route  POST /api/chargers
 * @access Private
 */
const addCharger = async (request, response) => {
  try {
    const { uid } = request;
    let newCharger = request.body;
    newCharger.createdAt = admin.firestore.Timestamp.now();
    let user = admin.firestore().collection('users').doc(uid);
    await user.update({
      chargers: admin.firestore.FieldValue.arrayUnion(newCharger),
    });
    response.status(201).json({ success: true });
  } catch (error) {
    response.status(400).json({ success: false, error: error.message });
  }
};

/**
 * @author Karen S. Diaz
 * @description Update charger
 * @param {*} request
 * @param {*} response
 * @route  PUT /api/chargers/:id
 * @access Private
 */

const updateCharger = async (request, response) => {
  try {
    let updates = request.body;
    let chargerId = request.params.chargerId.toString();
    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(updates);
    response.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/**
 * @author Karen S. Diaz
 * @description Get a charger's current data
 * @param {*} request
 * @param {*} response
 * @route  PUT /api/chargers/getCurrent/:chargerId
 * @access Private
 */
const getCurrent = async (request, response) => {
  try {
    // get charger id from url
    let { chargerId } = request.params;

    // get a snapshot of the data, limit of 4 data points
    let snapShot = await admin
      .firestore()
      .collection('chargers')
      .doc(chargerId)
      .collection('snapShots')
      .limit(4)
      .get();
    if (snapShot.empty) {
      throw new Error('No data available for this charger.');
    }
    let length = snapShot.docs.length;

    // calculate data for max current line
    // x axis is time
    // y axis is value of EVSE Max Current OR 1 if undefined
    let maxCurrentData = snapShot.docs.map((doc) => ({
      x: format(doc.data().timestamp._seconds * 1000, 'HH:mm'),
      y: doc.data()['EVSE Max Current'] ? +doc.data()['EVSE Max Current'] : 1,
    }));

    // calculate data for calculated current line
    // x axis is time
    // y axis is value of EVSE Calculated Current OR 1 if undefined
    let calcCurrentData = snapShot.docs.map((doc) => ({
      x: format(doc.data().timestamp._seconds * 1000, 'HH:mm'),
      y: doc.data()['EVSE Calculated Current']
        ? +doc.data()['EVSE Calculated Current']
        : 1,
    }));

    // data returned
    let data = [
      {
        id: 'EVSE Max Current',
        data: maxCurrentData,
      },
      {
        id: 'EVSE Calculated Current',
        data: calcCurrentData,
      },
    ];

    response.status(200).json({
      success: true,
      data,
      firstDoc: snapShot.docs[0].id,
      lastDoc: snapShot.docs[length - 1].id,
    });
  } catch (error) {
    console.log('error = ', error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/**
 * @author Karen S. Diaz
 * @description Get a charger's current data - used in pagination of data
 * @param {*} request
 * @param {*} response
 * @route  PUT /api/chargers/getPrevCurrent/:id
 * @access Private
 */
const getPrevCurrent = async (request, response) => {
  try {
    let { firstDoc, chargerId } = request.body;
    let ref = admin.firestore().collection('chargers').doc(chargerId);
    let firstQueryDoc = await ref.collection('snapShots').doc(firstDoc).get();

    let prev = await ref
      .collection('snapShots')
      .orderBy('timestamp')
      .endBefore(firstQueryDoc.data().timestamp)
      .limitToLast(4);

    let prevSnapShot = await prev.get();

    let data = prevSnapShot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    response.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/**
 * @author Karen S. Diaz
 * @description Get a charger's current data - used in pagination of data
 * @param {*} request
 * @param {*} response
 * @route  PUT /api/chargers/getNextCurrent/:id
 * @access Private
 */
const getNextCurrent = async (request, response) => {
  try {
    let { lastDoc, chargerId } = request.body;
    let ref = admin.firestore().collection('chargers').doc(chargerId);
    let lastQueryDoc = await ref.collection('snapShots').doc(lastDoc).get();

    let next = await ref
      .collection('snapShots')
      .orderBy('timestamp')
      .startAfter(lastQueryDoc.data().timestamp)
      .limit(5);

    let nextSnapshot = await next.get();
    console.log(nextSnapshot.docs);
    let data = nextSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    response.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/**
 * @author Karen S. Diaz
 * @description Get a charger's temperature data
 * @param {*} request
 * @param {*} response
 * @route  PUT /api/chargers/getTemperature/:chargerId
 * @access Private
 */
const getTemperature = async (request, response) => {
  try {
    let { chargerId } = request.params;
    console.log(chargerId);
    let snapShot = await admin
      .firestore()
      .collection('chargers')
      .doc(chargerId)
      .collection('snapShots')
      .limit(5)
      .get();

    if (snapShot.empty) {
      throw new Error('No data available for this charger.');
    }

    let temperatureData = snapShot.docs.map((doc) => ({
      x: format(doc.data().timestamp._seconds * 1000, 'HH:mm:ss'),
      y: doc.data()['EVSE Temperature']
        ? +doc
            .data()
            ['EVSE Temperature'].slice(
              0,
              doc.data()['EVSE Temperature'].length - 2
            )
        : 0,
    }));
    console.log(temperatureData);
    let data = [
      {
        id: 'EVSE Temperature',
        data: temperatureData,
      },
    ];
    response.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/**
 * @author Karen S. Diaz
 * @description Get a charger's payment state data
 * @param {*} request
 * @param {*} response
 * @route  PUT /api/chargers/getPaymentState/:id
 * @access Private
 */
const getPaymentState = async (request, response) => {
  try {
    let { chargerId } = request.params;
    let snapShot = await admin
      .firestore()
      .collection('chargers')
      .doc(chargerId)
      .collection('snapShots')
      .limit(5)
      .get();
    if (snapShot.empty) {
      throw new Error('No data available for this charger.');
    }
    let valuesMap = {};
    let paymentData = [];

    for (let doc of snapShot.docs) {
      let data = doc.data();
      let paymentState = data['EVSE Payment State'];
      if (valuesMap[paymentState] === undefined) {
        valuesMap[paymentState] = 1;
      } else {
        valuesMap[paymentState]++;
      }
    }

    for (let val of Object.keys(valuesMap)) {
      let avg = (valuesMap[val] / snapShot.docs.length) * 100;
      paymentData.push({
        id: val === 'false' ? 'Not Paid' : 'Paid',
        value: avg,
        label: val === 'false' ? 'Not Paid' : 'Paid',
      });
    }

    response.status(200).json({ success: true, data: paymentData });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

// Eamon's added function

/*
 * This function will set the passed in charger's
 * SERVER Disable EVSE? to true and
 * SERVER Enable EVSE? to false
 */
const setStationOff = async (request, response) => {
  try {
    let chargers = request.body;
    let chargerID = chargers.charger;
    const update = {
      'SERVER Disable EVSE?': true,
      'SERVER Enable EVSE?': false,
    };

    //let chargerId = request.params.chargerId.toString();
    let chargerRef = admin.database().ref(chargerID);
    await chargerRef.update(update);
    response.status(200).json({ success: true, chargerID });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/*
 * This function will set the passed in charger's
 * SERVER Disable EVSE? to false and
 * SERVER Enable EVSE? to true
 */
const setStationOn = async (request, response) => {
  try {
    let chargers = request.body;
    let chargerID = chargers.charger;
    const update = {
      'SERVER Disable EVSE?': false,
      'SERVER Enable EVSE?': true,
    };

    //let chargerId = request.params.chargerId.toString();
    let chargerRef = admin.database().ref(chargers.charger);
    await chargerRef.update(update);
    response.status(200).json({ success: true, chargerID });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/*
 * This function get the user id assigned to the charger
 */
const getUser = async (request, response) => {
  try {
    let { chargerId } = request.params;
    console.log('Performing getUser on charger ' + chargerId);

    let snapShot = await admin.database().ref(chargerId).get();

    let User = snapShot.child('SERVER User Sync');

    response.status(200).json({ success: true, User });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/*
 * This function sets the user id assigned to the charger
 */
const setUser = async (request, response) => {
  try {
    let info = request.body;
    let chargerID = info.charger;
    let User = info.user;
    const update = {
      'SERVER User Sync': User,
    };
    let chargerRef = admin.database().ref(chargerID);
    await chargerRef.update(update);
    response.status(200).json({ success: true, User });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/*
 * This function removes the user id assigned to the charger
 */
const removeUser = async (request, response) => {
  try {
    let info = request.body;
    let chargerID = info.charger;
    const update = {
      'SERVER User Sync': '',
    };
    let chargerRef = admin.database().ref(chargerID);
    await chargerRef.update(update);
    response.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

/*
 * This function will get a list of charger snapshots for the specifed charger
 */
const chargerHistory = async (request, response) => {
  try {
    let { chargerId } = request.params;
    var dataArray = chargerId.split(';');
    var snapShot;
    console.log('Performing chargerHistory on charger ' + dataArray[0]);

    if (dataArray[2] == null) {
      if (dataArray[1] == null) {
        var today = new Date();
        var date =
          today.getFullYear() +
          '-' +
          (today.getMonth() + 1) +
          '-' +
          today.getDate();
        const start = admin.firestore.Timestamp.fromDate(new Date(date));
        snapShot = await admin
          .firestore()
          .collection('chargers')
          .doc(dataArray[0])
          .collection('snapShots')
          .where('timestamp', '>=', start)
          .get();
      } else {
        const start = admin.firestore.Timestamp.fromDate(
          new Date(dataArray[1])
        );
        snapShot = await admin
          .firestore()
          .collection('chargers')
          .doc(dataArray[0])
          .collection('snapShots')
          .where('timestamp', '>=', start)
          .get();
      }
    } else {
      var tomorrow = new Date(dataArray[2]);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = admin.firestore.Timestamp.fromDate(new Date(dataArray[1]));
      const end = admin.firestore.Timestamp.fromDate(tomorrow);
      snapShot = await admin
        .firestore()
        .collection('chargers')
        .doc(dataArray[0])
        .collection('snapShots')
        .where('timestamp', '>=', start)
        .where('timestamp', '<=', end)
        .get();
    }

    let historyData = snapShot.docs.map((doc) => ({
      timestamp: format(
        doc.data().timestamp._seconds * 1000,
        'MM/dd/yy HH:mm:ss'
      ),
      data: doc.data(),
    }));

    let chargerHistory = [
      {
        chargerId: dataArray[0],
        snapshots: historyData,
      },
    ];

    await response.status(200).json({ success: true, chargerHistory });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

// End of  Eamon's added function

module.exports = {
  getAllChargers,
  getCharger,
  addCharger,
  updateCharger,
  getCurrent,
  getPrevCurrent,
  getNextCurrent,
  getTemperature,
  getPaymentState,
  setStationOff, // added by Eamon
  setStationOn, // added by Eamon
  getUser, //added by Eamon
  setUser, // added by Eamon
  removeUser, // added by Eamon
  chargerHistory, // added by Eamon
};
