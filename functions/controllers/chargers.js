const { admin, historicalAdmin } = require('../adminApp');
const { getAllocated } = require('../getAllocated');
const { format } = require('date-fns');
const jwt = require('jsonwebtoken');

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
 * @route  PUT /api/chargers/:chargerId
 * @access Private
 */

const updateCharger = async (request, response) => {
  try {
    let updates = request.body;

    let chargerId = request.params.chargerId.toString();
    console.log('updates = ', updates);
    console.log('Charger Id = ', chargerId);
    let chargerRef = admin.database().ref(chargerId);

    let res = await chargerRef.update(updates);

    let snapshot = await chargerRef.once('value');
    let charger = snapshot.val();
    response.status(200).json({ success: true, charger });
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

    // Set Current Data
    // calculate data for max current line on graph
    // x axis is time
    // y axis is value of EVSE Max Current OR null if none
    // if EVSE Max Current is a 5 digit num, divide by 1000

    let setCurrent = snapShot.docs
      .map((doc) => ({
        x: format(doc.data().timestamp._seconds * 1000, 'HH:mm'),
        y: doc.data()['EVSE Max Current']
          ? Number(doc.data()['EVSE Max Current'])
          : null,
      }))
      .filter((doc) => doc.y);

    // Measured data
    // calculate data for calculated current line
    // x axis is time
    // y axis is value of EVSE  Current

    let measuredCurrent = snapShot.docs
      .map((doc) => ({
        x: format(doc.data().timestamp._seconds * 1000, 'HH:mm'),
        y: doc.data()['EVSE Current'] ? Number(doc.data()['EVSE Current']) : null,
      }))
      .filter((doc) => doc.y !== null);

    // // Set Current Data
    // // x axis is time
    // // y axis is value of EVSE Max Current
    // // if EVSE Max Current is a 5 digit num, divide by 1000

    // let setCurrentData = snapShot.docs.filter(
    //   (doc) => doc.data()['EVSE Max Current']
    // );

    // setCurrentData = setCurrentData.map((doc) => ({
    //   x: format(doc.data().timestamp._seconds * 1000, 'HH:mm'),
    //   y: +doc.data()['EVSE Max Current'],
    // }));

    // // Measured data
    // // calculate data for calculated current line
    // // x axis is time
    // // y axis is value of EVSE  Current
    // let measuredCurrentData = snapShot.docs.filter(
    //   (doc) => doc.data()['EVSE Current']
    // );

    // measuredCurrentData = snapShot.docs.map((doc) => ({
    //   x: format(doc.data().timestamp._seconds * 1000, 'HH:mm'),
    //   y: +doc.data()['EVSE Current'],
    // }));

    // // data returned
    // let data = [
    //   {
    //     id: 'EVSE Set Current',
    //     data: setCurrentData,
    //   },
    //   {
    //     id: 'EVSE Measured Current',
    //     data: measuredCurrentData,
    //   },
    // ];

    // data returned
    let data = [
      {
        id: 'Set Current',

        data: setCurrent,
      },
      {
        id: 'Measured Current',

        data: measuredCurrent,
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
        ? Number(doc
          .data()['EVSE Temperature'].slice(
            0,
            doc.data()['EVSE Temperature'].length - 2
          ))
        : 0,
    }));

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
    let { chargerId } = request.params;
    const update = {
      'SERVER Disable EVSE?': true,
      'SERVER Enable EVSE?': false,
    };

    //let chargerId = request.params.chargerId.toString();
    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(update);
    response.status(200).json({ success: true, chargerId });
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
    let { chargerId } = request.params;
    const update = {
      'SERVER Disable EVSE?': false,
      'SERVER Enable EVSE?': true,
    };

    //let chargerId = request.params.chargerId.toString();
    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(update);
    response.status(200).json({ success: true, chargerId });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};


/*
 * This function will set the passed in charger's
 * SERVER Enable QuickPay? to true
 */
const setQuickpay = async (request, response) => {
  try {
    let { chargerId } = request.params;
    const update = {
      'SERVER Enable QuickPay?': true
    };

    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(update);
    response.status(200).json({ success: true, chargerId });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};


/*
 * This function will set the passed in charger's
 * SERVER Pause EVSE? to true
 */
const setPause = async (request, response) => {
  try {
    let { chargerId } = request.params;
    const update = {
      'SERVER Pause EVSE?': true
    };

    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(update);
    response.status(200).json({ success: true, chargerId });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};


/*
 * This function will set the passed in charger's
 * SERVER Reset EVSE? to true
 */
const setReset = async (request, response) => {
  try {
    let { chargerId } = request.params;
    const update = {
      'SERVER Reset EVSE?': true
    };

    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(update);
    response.status(200).json({ success: true, chargerId });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};


/*
 * This function will set the passed in charger's
 * SERVER Set Transaction Amount to the passed in amount for amount
 */
const setTransactionAmount = async (request, response) => {
  try {
    let { chargerId } = request.params;
    let { amount } = request.params;
    let inCents = parseInt(amount, 10);
    const update = {
      'SERVER Set Transaction Amount': inCents
    };

    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(update);
    response.status(200).json({ success: true, chargerId, SetPrice: inCents });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};


/*
 * This function will set the passed in charger's
 * SERVER Set Current Max to the passed in amount for current
 */
const setCurrent = async (request, response) => {
  try {
    let { chargerId } = request.params;
    let { current } = request.params;
    let maxCurrent = await parseInt(current, 10);
    if (await maxCurrent < 6) {
      maxCurrent = 6;
    } else  if ( await maxCurrent > 28) {
      maxCurrent = 28;
    }
    const update = {
      'SERVER Set Current Max': maxCurrent
    };

    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(update);
    response.status(200).json({ success: true, chargerId, SetMaxCurrent: maxCurrent });
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
    // const key = admin.firestore().collection("test").doc().id;
    // console.log(key);
    // await admin.firestore().collection('users').doc('userID').update({apiKey: key});

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
    let { chargerId } = request.params;
    let { userId } = request.params;
    const update = {
      'SERVER User Sync': userId,
    };
    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(update);
    response.status(200).json({ success: true, userId });
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
    let { chargerId } = request.params;
    const update = {
      'SERVER User Sync': '',
    };
    let chargerRef = admin.database().ref(chargerId);
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
    var dataArray = await chargerId.split(';');
    var snapShot;
    await console.log('Performing chargerHistory on charger ' + dataArray[0]);

    if (typeof dataArray[2] !== 'string') {
      // dataArray[2] is null
      if (typeof dataArray[1] !== 'string') {
        // dataArray[1] is null
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
        // dataArray[1] is not null
        const start = admin.firestore.Timestamp.fromDate(
          new Date(dataArray[1]));
        snapShot = await admin
          .firestore()
          .collection('chargers')
          .doc(dataArray[0])
          .collection('snapShots')
          .where('timestamp', '>=', start)
          .get();
      }
    } else {
      // dataArray[2] is not null
      const start = admin.firestore.Timestamp.fromDate(new Date(dataArray[1]));
      const end = admin.firestore.Timestamp.fromDate(new Date(dataArray[2]));
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

/*
 * This function makes a token for the user
 */
const getToken = async (request, response) => {
  try {
    let {apiKey} = request.params;
    let wrongKey = "Invalid API Key";
    let wrongUser = "An error occurred authenticating the user";
    var uid;
    var userdata;
    var key = await admin.firestore().collection('apiTokenEncryptionKey').doc('secretToken').get('token');
    var encode = key.data().token;
    var today =  await new Date();
    var nextTime = await new Date(today.getTime() + 10 * 60000);
    console.log('Getting Token ');
    await admin.firestore().collection('apiKeys').doc(apiKey).get().then((docSnapshot) => { 
      if (docSnapshot.exists) {
        uid = docSnapshot.data().uid;
      } else {
        console.log('No such document!');
        response.status(400).json({ success: false, error: wrongKey });
      }
      return null;
    });

    await admin.firestore().collection('users').doc(uid).get().then((docSnapshot) => { 
      if (docSnapshot.exists) {
        userdata = docSnapshot.data().chargers;
      } else {
        console.log('No such user!');
        response.status(400).json({ success: false, error: wrongUser});
      }
      return null;
    });

    var token = jwt.sign({ TOKEN: userdata, EXPIRATION: nextTime }, encode);
    response.status(200).json({token});

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
  setQuickpay, // added by Eamon
  setPause, // added by Eamon
  setReset, // added by Eamon
  setTransactionAmount, // added by Eamon
  setCurrent, // added by Eamon
  getUser, //added by Eamon
  setUser, // added by Eamon
  removeUser, // added by Eamon
  chargerHistory, // added by Eamon
  getToken, // added by Eamon
};
