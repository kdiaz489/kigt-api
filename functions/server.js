const express = require('express');
const cors = require('cors');
const app = express();

const auth = require('./routes/auth');
const chargers = require('./routes/chargers');
const zendesk = require('./routes/zendesk');
app.use(cors({ origin: true }));
app.use('/auth', auth);
app.use('/chargers', chargers);
app.use('/zendesk', zendesk);

module.exports = app;
