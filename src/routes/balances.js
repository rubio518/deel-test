const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../models/db');
const contractStates = require('../models/contractStates');

const router = express.Router();
const deposit = async (userId, amount, models) => {
  const { Job, Profile, Contract } = models;
  const result = await sequelize.transaction(async (t) => {
    const profile = await Profile.findByPk(userId, { transaction: t });
    const jobsRaw = await Job.findOne({
      include: {
        model: Contract,
        where: {
          clientId: userId,
          status: { [Op.in]: [contractStates.inProgress, contractStates.new] },
        },
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('price')), 'price_sum'],
      ],
      transaction: t,
    });
    const jobsToPay = jobsRaw.get().price_sum;
    if (amount > jobsToPay * 0.25) {
      throw new Error("Client can't deposit more than 25% of jobs to pay");
    }
    await profile.increment('balance', { by: amount, transaction: t });
  });
  return result;
};

router.post('/deposit/:userId', async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  try {
    await deposit(userId, amount, req.app.get('models'));
    res.json({ message: `deposited ${amount} to user ${userId}` });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
