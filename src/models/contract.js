const Sequelize = require('sequelize');
const contractStates = require('./contractStates');
const sequelize = require('./db');

class Contract extends Sequelize.Model {}
Contract.init(
  {
    terms: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM(Object.values(contractStates)),
    },
  },
  {
    sequelize,
    modelName: 'Contract',
  },
);
module.exports = Contract;
