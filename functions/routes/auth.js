const router = require('express').Router();
const controller = require('../controllers/auth');
const { checkIfAuthenticated } = require('../middleware/getAuthToken');

router.post('/register', controller.register);
router.put('/updateaccount', checkIfAuthenticated, controller.updateAccount);

module.exports = router;
