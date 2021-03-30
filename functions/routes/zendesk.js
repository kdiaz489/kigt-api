const router = require('express').Router();
const controller = require('../controllers/zendesk');

router.post('/', controller.sendZendeskTicket);

module.exports = router;
