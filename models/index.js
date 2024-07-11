const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

const URL = sequelize.define('URL', {
  long_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  short_url: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  qr_code: {
    type: DataTypes.TEXT
  }
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

User.hasMany(URL, { foreignKey: 'user_id' });
URL.belongsTo(User, { foreignKey: 'user_id' });

sequelize.sync();

module.exports = { sequelize, URL, User };
