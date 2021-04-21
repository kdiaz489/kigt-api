const { admin, historicalAdmin } = require('../adminApp');
const { getAllocated } = require('../getAllocated');
const { format } = require('date-fns');

/**
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
    return response.status(400).json({ error: error.message });
  }
};

/**
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
 * @description Update charger
 * @param {*} request
 * @param {*} response
 * @route  PUT /api/chargers/:id
 * @access Private
 */

const updateCharger = async (request, response) => {
  try {
    let updates = request.body;
    let chargerId = request.params.id.toString();
    let chargerRef = admin.database().ref(chargerId);
    await chargerRef.update(updates);
    response.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

const getCurrent = async (request, response) => {
  try {
    let { chargerId } = request.params;
    let snapShot = await admin
      .firestore()
      .collection('chargers')
      .doc(chargerId)
      .collection('snapShots')
      .limit(5)
      .get();
    let maxCurrentData = snapShot.docs.map((doc) => ({
      x: format(doc.data().timestamp._seconds * 1000, 'MM/dd/yy HH:mm:ss'),
      y: +doc.data()['EVSE Max Current'],
    }));
    let calcCurrentData = snapShot.docs.map((doc) => ({
      x: format(doc.data().timestamp._seconds * 1000, 'MM/dd/yy HH:mm:ss'),
      y: doc.data()['EVSE Calculated Current']
        ? +doc.data()['EVSE Calculated Current']
        : +doc.data()['EVSE Max Current'] + 1,
    }));
    let data = [
      {
        id: 'EVSE Max Current',
        color: 'hsl(209,70%,50%)',
        data: maxCurrentData,
      },
      {
        id: 'EVSE Calculated Current',
        color: 'hsl(256,70%,50%)',
        data: calcCurrentData,
      },
    ];
    response.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};
const getPrevCurrent = async (request, response) => {
  try {
    let { firstDoc, chargerId } = request.body;
    let firstQueryDoc = await admin
      .firestore()
      .collection('chargers')
      .doc(chargerId)
      .collection('snapShots')
      .doc(firstDoc)
      .get();

    let snapShot = await admin
      .firestore()
      .collection('chargers')
      .doc('113882052')
      .collection('snapShots')
      .endBefore(firstQueryDoc)
      .limitToLast(5)
      .get();

    let data = snapShot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    console.log(data);
    response.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};
const getNextCurrent = async (request, response) => {
  try {
    let { lastDoc, chargerId } = request.body;
    let lastQueryDoc = await admin
      .firestore()
      .collection('chargers')
      .doc(chargerId)
      .collection('snapShots')
      .doc(lastDoc)
      .get();
    let snapShot = await admin
      .firestore()
      .collection('chargers')
      .doc('113882052')
      .collection('snapShots')
      .startAfter(lastQueryDoc)
      .limit(5)
      .get();
    let data = snapShot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    console.log(data);
    response.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

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

    snapShot.docs.map((doc) => console.log(doc.data()));

    let temperatureData = snapShot.docs.map((doc) => ({
      x: format(doc.data().timestamp._seconds * 1000, 'MM/dd/yy HH:mm:ss'),
      y: +doc
        .data()['EVSE Temperature'].slice(
          0,
          doc.data()['EVSE Temperature'].length - 2
        ),
    }));

    let data = [
      {
        id: 'EVSE Temperature',
        color: 'hsl(209,70%,50%)',
        data: temperatureData,
      },
    ];
    response.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
    response.status(400).json({ success: false, error: error.message });
  }
};

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
      console.log(typeof val);
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
      "SERVER Disable EVSE?": true,
      "SERVER Enable EVSE?": false,
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
      "SERVER Disable EVSE?": false,
      "SERVER Enable EVSE?": true,
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

// End of  Eamon's added function


module.exports = {
  getAllChargers,
  addCharger,
  updateCharger,
  getCurrent,
  getPrevCurrent,
  getNextCurrent,
  getTemperature,
  getPaymentState,
  setStationOff, // added by Eamon
  setStationOn, // added by Eamon 
};

// dashApp.use(cors({ origin: true }));

// dashApp.get('/filterData', async (request, response) => {
//   const chargerId = request.body.id;

//   try {
//     let snapshot = await admin
//       .firestore()
//       .collection('chargers')
//       .doc(chargerId)
//       .collection('snapShots')
//       .get();

//     let data = snapshot.docs.map((doc) => {
//       return { id: doc.id, ...doc.data() };
//     });
//     response.status(200).send({ data });
//   } catch (error) {
//     response.status(400).send({ error: error.message });
//   }
// });

// dashApp.get('/filterByDate', async (request, response) => {
//   // To Do - Confirm time coming from front end is in utc
//   const time = new Date(request.body.time);

//   const chargerId = request.body.id;
//   try {
//     let snapshot = await admin
//       .firestore()
//       .collection('chargers')
//       .doc(chargerId)
//       .collection('snapShots')
//       .where('timestamp', '>=', time)
//       .get();
//     let data = snapshot.docs.map((doc) => {
//       console.log(doc.data().timestamp.toDate());
//       return { id: doc.id, ...doc.data() };
//     });
//     response.status(200).send({ data });
//   } catch (error) {
//     response.status(400).send({ error: error.message });
//   }
// });

// dashApp.get('/filterByTime', async (request, response) => {
//   const time = new Date(request.body.time);
//   console.log(time.getUTCDate());
//   console.log(time);
//   const chargerId = request.body.id;
//   try {
//     let snapshot = await admin
//       .firestore()
//       .collection('chargers')
//       .doc(chargerId)
//       .collection('snapShots')
//       .where('timestamp', '>=', time)
//       .get();
//     let data = snapshot.docs.map((doc) => {
//       console.log(doc.data().timestamp.toDate());
//       return { id: doc.id, ...doc.data() };
//     });
//     response.status(200).send({ data });
//   } catch (error) {
//     response.status(400).send({ error: error.message });
//   }
// });

// dashApp.get('/getAggregate', async (request, response) => {
//   //   response.set('Access-Control-Allow-Origin', '*');
//   //   response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
//   //   response.set('Access-Control-Allow-Headers', '*');
//   try {
//     let data = [];
//     let chargers = await admin.firestore().collection('chargers').get();
//     let numChargers = 0;
//     numChargers = chargers.docs.length;
//     let rtdb = admin.database().ref();
//     let available = numChargers * 30;
//     //Not needed for now
//     // let now = new Date();
//     // let i = 6;
//     // let dates = [now.getDate()];
//     // while (i--) {
//     //   now.setDate(now.getDate() - 1);
//     //   dates.push(now.toUTCString());
//     // }
//     // dates.reverse();
//     // console.log('Dates Array', dates);

//     let snapshot = await admin
//       .firestore()
//       .collection('chargers')
//       .doc('113882052')
//       .collection('snapShots')
//       .get();

//     const { allocated } = await getAllocated(rtdb);

//     data = snapshot.docs.map((doc) => {
//       return { id: doc.id, allocated, available, ...doc.data() };
//     });

//     response.status(200).send({ allocated, available, data });
//   } catch (err) {
//     response.status(400).send({ error: err.message });
//   }

//   return new Promise((resolve, reject) => {});
// });

// exports.api = functions.https.onRequest(dashApp);
