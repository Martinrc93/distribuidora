const dotenv = require('dotenv');
const path = require('path');

const env = process.env.NODE_ENV || 'development';

dotenv.config({
    path: path.resolve(__dirname, `../.env.${env}`)
});

module.exports = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || 3000,
    DB_URL: process.env.DB_URL,
};