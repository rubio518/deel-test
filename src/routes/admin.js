const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../models/db');

const router = express.Router();

router.get('/best-profession', async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models');
  const { start, end } = req.query;

  const jobsPaid = await Job.findOne({
    where: {
      paid: true,
      paymentDate: { [Op.between]: [start, end] },
    },
    include: [{
      model: Contract,
      include: { model: Profile, as: 'Contractor' },
    }],
    group: 'Contract.Contractor.profession',
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('Contract.Contractor.id')), 'jobs_count'],
    ],
    order: [['jobs_count', 'DESC']],
  });
  res.json({ profession: jobsPaid.Contract.Contractor.profession });
});

router.get('/best-clients', async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models');
  const { start, end, limit = 2 } = req.query;
  const bestclients = await Job.findAll({
    where: {
      paid: true,
      paymentDate: { [Op.between]: [start, end] },
    },
    include: [{
      model: Contract,
      include: { model: Profile, as: 'Client' },
    }],
    group: 'Contract.Client.id',
    attributes: [
      [sequelize.fn('SUM', sequelize.col('price')), 'price_sum'],
    ],
    order: [['price_sum', 'DESC']],
    limit,
  });
  const bestclientsResponse = bestclients.map((bc) => {
    const bestClient = bc.get();
    return {
      id: bestClient.Contract.Client.id,
      fullName: `${bestClient.Contract.Client.firstName} ${bestClient.Contract.Client.lastName}`,
      paid: bestClient.price_sum,
    };
  });
  res.json(bestclientsResponse);
});

module.exports = router;
