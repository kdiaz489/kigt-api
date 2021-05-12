const router = require('express').Router();
const controller = require('../controllers/chargers');
const { checkIfAuthenticated } = require('../middleware/getAuthToken');

router.get('/', checkIfAuthenticated, controller.getAllChargers);
router.get('/getCurrent/:chargerId', controller.getCurrent);
router.get('/getTemperature/:chargerId', controller.getTemperature);
router.get('/getPaymentState/:chargerId', controller.getPaymentState);
router.get('/user/:chargerId', controller.getUser); // added by Eamon
router.get('/getChargerHistory/:chargerId', controller.chargerHistory); // added by Eamon
router.post('/', checkIfAuthenticated, controller.addCharger);
router.put('/updateCharger/:id', controller.updateCharger);
router.put('/setStationOff', controller.setStationOff); // added by Eamon
router.put('/setStationOn', controller.setStationOn); // added by Eamon
router.put('/user', controller.setUser); // added by Eamon
router.delete('/user', controller.removeUser); // added by Eamon

module.exports = router;
