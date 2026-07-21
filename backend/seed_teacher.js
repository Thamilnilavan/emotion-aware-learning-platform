const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/emolearn')
  .then(async () => {
    // Check if teacher already exists
    const existingTeacher = await User.findOne({ email: 'teacher@emolearn.com' });
    if (existingTeacher) {
      console.log('Teacher user already exists:', existingTeacher.email);
      mongoose.connection.close();
      return;
    }

    // Create teacher user
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    const teacher = new User({
      name: 'Teacher User',
      email: 'teacher@emolearn.com',
      password: hashedPassword,
      role: 'teacher',
      programme: 'Computer Science',
      icbtNumber: 'T001',
      isActive: true
    });

    await teacher.save();
    console.log('Teacher user created successfully!');
    console.log('Email: teacher@emolearn.com');
    console.log('Password: teacher123');
    console.log('Role: teacher');
    
    mongoose.connection.close();
  })
  .catch(console.error);
