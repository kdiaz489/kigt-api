const router = require('express').Router();
const controller = require('../controllers/chargers');
const { checkIfAuthenticated } = require('../middleware/getAuthToken');

router.get('/', checkIfAuthenticated, controller.getAllChargers);
router.get(
  '/getCharger/:chargerId',
  checkIfAuthenticated,
  controller.getCharger
);
router.get('/getCurrent/:chargerId', controller.getCurrent);
router.get('/getNextCurrent/:chargerId', controller.getNextCurrent);
router.get('/getPrevCurrent/:chargerId', controller.getPrevCurrent);
router.get('/getTemperature/:chargerId', controller.getTemperature);
router.get('/getPaymentState/:chargerId', controller.getPaymentState);
router.post('/', checkIfAuthenticated, controller.addCharger);
router.put('/updateCharger/:chargerId', controller.updateCharger);
router.put('/setStationOff', controller.setStationOff); // added by Eamon
router.put('/setStationOn', controller.setStationOn); // added by Eamon

module.exports = router;
