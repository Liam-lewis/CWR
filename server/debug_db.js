const sequelize = require('./config/database');
const User = require('./models/User');
const Report = require('./models/Report');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    const users = await User.findAll();
    console.log('Users:', users.map(u => ({ id: u.id, username: u.username, role: u.role })));

    const reports = await Report.findAll();
    console.log('Reports Count:', reports.length);
    if (reports.length > 0) {
        console.log('First Report:', reports[0].toJSON());
    }

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
})();
