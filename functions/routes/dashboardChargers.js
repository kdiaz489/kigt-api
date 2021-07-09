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

router.get('/getCurrent/:token/:chargerId', controller.getCurrent);
router.get('/getNextCurrent/:token/:chargerId', controller.getNextCurrent);
router.get('/getPrevCurrent/:token/:chargerId', controller.getPrevCurrent);
router.get('/getTemperature/:token/:chargerId', controller.getTemperature);
router.get('/getPaymentState/:token/:chargerId', controller.getPaymentState);
router.post('/', checkIfAuthenticated, controller.addCharger);
router.put('/updateCharger/:token/:chargerId', controller.updateCharger);

module.exports = router;