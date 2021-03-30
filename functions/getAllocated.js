/**
 *  Calculates allocated energy among set of stations connected to Real Time Database
 * @param {App} rtdb
 * @return {Object} Object with total allocated energy
 */
exports.getAllocated = (rtdb) => {
  return new Promise((resolve, reject) => {
    let allocated = 0;
    const onError = (error) => reject(error);
    const onData = (snapshot) => {
      let realtime = snapshot.val();
      for (let key in realtime) {
        realtime[key]['EVSE Max Current'] &&
          (allocated += Number(realtime[key]['EVSE Max Current']));
      }
      resolve({ allocated });
    };
    rtdb.once('value', onData, onError);
  });
};
