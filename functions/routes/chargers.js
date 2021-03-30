const router = require('express').Router();
const controller = require('../controllers/chargers');
const { checkIfAuthenticated } = require('../middleware/getAuthToken');

router.get('/', checkIfAuthenticated, controller.getAllChargers);
router.get('/getCurrent/:chargerId', controller.getCurrent);
router.get('/getTemperature/:chargerId', controller.getTemperature);
router.get('/getPaymentState/:chargerId', controller.getPaymentState);
router.post('/', checkIfAuthenticated, controller.addCharger);
router.put('/:id', controller.updateCharger);

module.exports = router;
