const express = require('express');
const { Op } = require('sequelize');
const contractStates = require('../models/contractStates');
const sequelize = require('../models/db');

const router = express.Router();

router.get('/unpaid', async (req, res) => {
  const { Job, Contract } = req.app.get('models');
  const { id: profileId } = req.profile.get();
  const jobs = await Job.findAll({
    include: {
      model: Contract,
      where: {
        [Op.or]: [
          {
            clientId: profileId,
            status: contractStates.inProgress,
          },
          {
            contractorId: profileId,
            status: contractStates.inProgress,
          },
        ],
      },
    },
  });
  res.json(jobs);
});

const payJob = async (jobId, profileId, models) => {
  const { Job, Profile, Contract } = models;
  const result = await sequelize.transaction(async (t) => {
    const client = await Profile.findByPk(profileId, { transaction: t });
    const job = await Job.findByPk(jobId, {
      include: { model: Contract },
      transaction: t,
    });
    if (job.Contract.ClientId !== client.id) {
      throw new Error(`This job does not belong to user ${client.id}`);
    }
    if (client.balance >= job.price) {
      client.decrement('balance', { by: job.price, transaction: t });

      const contractor = await Profile.findByPk(job.Contract.ContractorId, { transaction: t });
      contractor.increment('balance', { by: job.price, transaction: t });

      await Job.update({ paid: true, paymentDate: new Date() }, {
        where: { id: jobId },
        transaction: t,
      });
    } else {
      throw new Error('User does not have enough funds');
    }
    return job;
  });
  return result;
};

router.post('/:job_id/pay', async (req, res) => {
  const { job_id: jobId } = req.params;
  const profile = req.profile.get();
  try {
    await payJob(jobId, profile.id, req.app.get('models'));
    res.json({ jobId, paid: true });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
