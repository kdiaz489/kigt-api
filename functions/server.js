const express = require('express');
const cors = require('cors');
const app = express();

const auth = require('./routes/auth');
const chargers = require('./routes/chargers');
const zendesk = require('./routes/zendesk');
const dashboardChargers = require('./routes/dashboardChargers')
app.use(cors({ origin: true }));
app.use('/auth', auth);
app.use('/chargers', chargers);
app.use('/zendesk', zendesk);
app.use('/dashboard/chargers', dashboardChargers);


module.exports = app;
