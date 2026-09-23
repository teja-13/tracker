const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  driveDate: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    default: '',
    trim: true
  },
  driveType: {
    type: String,
    enum: ['Campus Drive', 'Beyond Drive'],
    default: 'Campus Drive'
  },
  status: {
    type: String,
    enum: [
      'Upcoming',
      'Applied',
      'Shortlisted',
      'Test Completed',
      'Interview',
      'Selected',
      'Rejected',
      'Completed'
    ],
    default: 'Upcoming'
  },
  examStatus: {
    type: String,
    enum: ['Not Completed', 'Completed'],
    default: 'Not Completed'
  },
  driveLink: {
    type: String,
    default: '',
    trim: true
  },
  resumeLink: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Drive', driveSchema);
