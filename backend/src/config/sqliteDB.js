const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE,
    logging: false,
});

const connectSQLite = async () => {
    try {
        await sequelize.authenticate();
        console.log('SQLite connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the SQLite database:', error.message);
    }
};

module.exports = { sequelize, connectSQLite };
