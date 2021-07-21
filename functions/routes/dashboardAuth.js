const router = require('express').Router();
const controller = require('../controllers/auth');
const { checkIfAuthenticated } = require('../middleware/getAuthToken');

router.post('/register', controller.register);
router.put('/updateaccount', checkIfAuthenticated, controller.updateAccount);
router.put('/genApiKey', checkIfAuthenticated, controller.generateApiKey);

module.exports = router;
