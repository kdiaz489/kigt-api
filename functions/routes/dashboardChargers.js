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

router.get('/getCurrent/:chargerId', controller.getCurrent);
router.get('/getNextCurrent/:chargerId', controller.getNextCurrent);
router.get('/getPrevCurrent/:chargerId', controller.getPrevCurrent);
router.get('/getTemperature/:chargerId', controller.getTemperature);
router.get('/getPaymentState/:chargerId', controller.getPaymentState);
router.post('/', checkIfAuthenticated, controller.addCharger);
router.put('/updateCharger/:chargerId', controller.updateCharger);

module.exports = router;