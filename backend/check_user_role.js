const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/emolearn')
  .then(async () => {
    const users = await User.find({}, 'name email role').limit(10);
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    mongoose.connection.close();
  })
  .catch(console.error);
