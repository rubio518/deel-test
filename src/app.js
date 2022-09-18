const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const { getProfile } = require('./middleware/getProfile');
const jobsRoutes = require('./routes/jobs');
const balancesRoutes = require('./routes/balances');
const contractsRoutes = require('./routes/contracts');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

app.use('/jobs', getProfile, jobsRoutes);
app.use('/balances', balancesRoutes);
app.use('/contracts', getProfile, contractsRoutes);
app.use('/admin', adminRoutes);
module.exports = app;
