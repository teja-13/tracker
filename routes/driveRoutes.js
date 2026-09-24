const express = require('express');
const router = express.Router();
const Drive = require('../models/Drive');

// GET /api/drives - Get all placement drives sorted by newest creation date
router.get('/', async (req, res) => {
  try {
    // .lean() improves query execution speed by returning plain JS objects instead of full Mongoose Documents
    const drives = await Drive.find().sort({ createdAt: -1 }).lean();
    return res.json(drives);
  } catch (error) {
    console.error('Error fetching drives from MongoDB Atlas:', error);
    res.status(500).json({ error: 'Failed to fetch placement drives from database' });
  }
});

// POST /api/drives - Create a new placement drive
router.post('/', async (req, res) => {
  try {
    const { companyName, driveDate, role, driveType, status, examStatus, driveLink, resumeLink } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ error: 'Company Name is required' });
    }

    const driveData = {
      companyName: companyName.trim(),
      driveDate: driveDate ? new Date(driveDate) : null,
      role: role ? role.trim() : '',
      driveType: driveType || 'Campus Drive',
      status: status || 'Upcoming',
      examStatus: examStatus || 'Not Completed',
      driveLink: driveLink ? driveLink.trim() : '',
      resumeLink: resumeLink ? resumeLink.trim() : ''
    };

    const newDrive = new Drive(driveData);
    const savedDrive = await newDrive.save();
    return res.status(201).json(savedDrive);
  } catch (error) {
    console.error('Error creating drive in MongoDB Atlas:', error);
    res.status(500).json({ error: 'Failed to create placement drive' });
  }
});

// PUT /api/drives/:id - Update an existing placement drive
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, driveDate, role, driveType, status, examStatus, driveLink, resumeLink } = req.body;

    if (companyName !== undefined && !companyName.trim()) {
      return res.status(400).json({ error: 'Company Name cannot be empty' });
    }

    const updateFields = {};
    if (companyName !== undefined) updateFields.companyName = companyName.trim();
    if (driveDate !== undefined) updateFields.driveDate = driveDate ? new Date(driveDate) : null;
    if (role !== undefined) updateFields.role = role.trim();
    if (driveType !== undefined) updateFields.driveType = driveType;
    if (status !== undefined) updateFields.status = status;
    if (examStatus !== undefined) updateFields.examStatus = examStatus;
    if (driveLink !== undefined) updateFields.driveLink = driveLink.trim();
    if (resumeLink !== undefined) updateFields.resumeLink = resumeLink.trim();

    const updatedDrive = await Drive.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedDrive) {
      return res.status(404).json({ error: 'Placement drive not found' });
    }
    return res.json(updatedDrive);
  } catch (error) {
    console.error('Error updating drive in MongoDB Atlas:', error);
    res.status(500).json({ error: 'Failed to update placement drive' });
  }
});

// DELETE /api/drives/:id - Delete a placement drive
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDrive = await Drive.findByIdAndDelete(id);
    if (!deletedDrive) {
      return res.status(404).json({ error: 'Placement drive not found' });
    }
    return res.json({ message: 'Placement drive deleted successfully', id });
  } catch (error) {
    console.error('Error deleting drive from MongoDB Atlas:', error);
    res.status(500).json({ error: 'Failed to delete placement drive' });
  }
});

module.exports = router;
