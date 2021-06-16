const router = require('express').Router();
const controller = require('../controllers/chargers');
const { checkIfAuthenticated } = require('../middleware/getAuthToken');
const { checkKey } = require('../middleware/getAuthToken');
const { checkToken } = require('../middleware/getAuthToken');

router.get('/', checkIfAuthenticated, controller.getAllChargers);
router.get(
  '/getCharger/:chargerId',
  checkIfAuthenticated,
  controller.getCharger
);

//router.get('/getToken/:apiKey', controller.getToken);

router.get('/getCurrent/:chargerId', controller.getCurrent);
router.get('/getNextCurrent/:chargerId', controller.getNextCurrent);
router.get('/getPrevCurrent/:chargerId', controller.getPrevCurrent);
router.get('/getTemperature/:chargerId', controller.getTemperature);
router.get('/getPaymentState/:token/:chargerId', checkToken, controller.getPaymentState);
router.get('/user/:chargerId', controller.getUser); // added by Eamon
router.get('/token/:apiKey', checkKey, controller.getToken); // added by Eamon
router.get('/getChargerHistory/:chargerId', controller.chargerHistory); // added by Eamon
router.post('/', checkIfAuthenticated, controller.addCharger);
router.put('/updateCharger/:chargerId', controller.updateCharger);
router.put('/setStationOff', controller.setStationOff); // added by Eamon
router.put('/setStationOn', controller.setStationOn); // added by Eamon
router.put('/user', controller.setUser); // added by Eamon
router.delete('/user', controller.removeUser); // added by Eamon

module.exports = router;