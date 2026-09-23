const express = require('express');
const router = express.Router();
const Drive = require('../models/Drive');
const mongoose = require('mongoose');

// In-memory fallback database if MongoDB Atlas is not connected yet
let memoryDrives = [];

const isMongoConnected = () => mongoose.connection.readyState === 1;

// GET /api/drives - Get all placement drives
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const drives = await Drive.find().sort({ createdAt: -1 });
      return res.json(drives);
    } else {
      return res.json(memoryDrives);
    }
  } catch (error) {
    console.error('Error fetching drives:', error);
    res.status(500).json({ error: 'Failed to fetch placement drives' });
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

    if (isMongoConnected()) {
      const newDrive = new Drive(driveData);
      const savedDrive = await newDrive.save();
      return res.status(201).json(savedDrive);
    } else {
      const newDrive = {
        _id: 'mem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        ...driveData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryDrives.unshift(newDrive);
      return res.status(201).json(newDrive);
    }
  } catch (error) {
    console.error('Error creating drive:', error);
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

    if (isMongoConnected()) {
      const updatedDrive = await Drive.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
      if (!updatedDrive) {
        return res.status(404).json({ error: 'Placement drive not found' });
      }
      return res.json(updatedDrive);
    } else {
      const index = memoryDrives.findIndex(d => d._id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Placement drive not found' });
      }
      memoryDrives[index] = {
        ...memoryDrives[index],
        ...updateFields,
        updatedAt: new Date()
      };
      return res.json(memoryDrives[index]);
    }
  } catch (error) {
    console.error('Error updating drive:', error);
    res.status(500).json({ error: 'Failed to update placement drive' });
  }
});

// DELETE /api/drives/:id - Delete a placement drive
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const deletedDrive = await Drive.findByIdAndDelete(id);
      if (!deletedDrive) {
        return res.status(404).json({ error: 'Placement drive not found' });
      }
      return res.json({ message: 'Placement drive deleted successfully', id });
    } else {
      const index = memoryDrives.findIndex(d => d._id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Placement drive not found' });
      }
      memoryDrives.splice(index, 1);
      return res.json({ message: 'Placement drive deleted successfully', id });
    }
  } catch (error) {
    console.error('Error deleting drive:', error);
    res.status(500).json({ error: 'Failed to delete placement drive' });
  }
});

module.exports = router;
