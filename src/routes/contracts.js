const express = require('express');
const { Op } = require('sequelize');
const contractStates = require('../models/contractStates');

const router = express.Router();

router.get('/', async (req, res) => {
  const { Contract } = req.app.get('models');
  const { id: profileId } = req.profile.get();
  const contracts = await Contract.findAll({
    where: {
      [Op.or]: [
        {
          clientId: profileId,
          status: {
            [Op.in]: [contractStates.inProgress, contractStates.new],
          },
        },
        {
          contractorId: profileId,
          status: { [Op.in]: [contractStates.inProgress, contractStates.new] },
        },
      ],
    },
  });
  res.json(contracts);
});

router.get('/:id', async (req, res) => {
  const { Contract } = req.app.get('models');
  const { id } = req.params;
  const { id: profileId } = req.profile.get();
  const contract = await Contract.findOne({
    where: {
      [Op.or]: [
        { id, clientId: profileId },
        { id, contractorId: profileId },
      ],
    },
  });
  if (!contract) return res.status(404).end();
  return res.json(contract);
});

module.exports = router;
