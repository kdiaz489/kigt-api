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
router.get('/user/:token/:chargerId', checkToken, controller.getUser); // added by Eamon
router.get('/token/:apiKey', checkKey, controller.getToken); // added by Eamon
router.get('/getChargerHistory/:token/:chargerId', checkToken, controller.chargerHistory); // added by Eamon
router.post('/', checkIfAuthenticated, controller.addCharger);
router.put('/updateCharger/:token/:chargerId', checkToken, controller.updateCharger);
router.put('/setStationOff/:token/:chargerId', checkToken, controller.setStationOff); // added by Eamon
router.put('/setStationOn/:token/:chargerId', checkToken, controller.setStationOn); // added by Eamon
router.put('/setQuickpay/:token/:chargerId', checkToken, controller.setQuickpay); // added by Eamon
router.put('/setPause/:token/:chargerId', checkToken, controller.setPause); // added by Eamon
router.put('/setReset/:token/:chargerId', checkToken, controller.setReset); // added by Eamon
router.put('/setTransactionAmount/:token/:chargerId/:amount', checkToken, controller.setTransactionAmount); // added by Eamon
router.put('/setCurrent/:token/:chargerId/:current', checkToken, controller.setCurrent); // added by Eamon
router.put('/user/:token/:chargerId/:userId', checkToken, controller.setUser); // added by Eamon
router.delete('/user/:token/:chargerId', checkToken, controller.removeUser); // added by Eamon

module.exports = router;