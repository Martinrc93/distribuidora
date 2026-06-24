const { Sequelize } = require('sequelize');

console.log('Starting test...');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: console.log,
    hooks: {
        afterConnect: (connection, config) => {
            console.log('--- afterConnect hook called!');
            return new Promise((resolve, reject) => {
                connection.serialize(() => {
                    connection.run('PRAGMA foreign_keys = ON;', (err) => {
                        if (err) {
                            console.error('Error enabling foreign keys:', err);
                            return reject(err);
                        }
                        console.log('Foreign keys enabled successfully!');
                        connection.run('PRAGMA journal_mode = WAL;', (err) => {
                            if (err) {
                                console.error('Error enabling WAL:', err);
                                return reject(err);
                            }
                            console.log('WAL mode enabled successfully!');
                            connection.run('PRAGMA busy_timeout = 5000;', (err) => {
                                if (err) {
                                    console.error('Error setting busy timeout:', err);
                                    return reject(err);
                                }
                                console.log('Busy timeout set successfully!');
                                resolve();
                            });
                        });
                    });
                });
            });
        }
    }
});

async function run() {
    try {
        console.log('Before query...');
        const result = await sequelize.query('SELECT 1 + 1 AS result');
        console.log('Query result:', result);
    } catch (e) {
        console.error('Query failed:', e);
    } finally {
        await sequelize.close();
    }
}
run();

