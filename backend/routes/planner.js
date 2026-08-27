const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const StudyPlan = require('../models/StudyPlan');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();
router.use(verifyToken, requireRole('student'));

router.get('/', async (req, res) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user.id }).sort({ scheduledAt: 1 }).lean();
    return res.json({ success: true, plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post(
  '/',
  [
    body('title').trim().isLength({ min: 1, max: 160 }),
    body('scheduledAt').isISO8601().toDate(),
    body('durationMinutes').isInt({ min: 5, max: 480 }).toInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Valid title, date, time, and duration are required' });
      }
      const plan = await StudyPlan.create({
        userId: req.user.id,
        title: req.body.title,
        scheduledAt: req.body.scheduledAt,
        durationMinutes: req.body.durationMinutes,
      });
      return res.status(201).json({ success: true, plan });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid planner entry ID' });
    }
    const plan = await StudyPlan.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!plan) return res.status(404).json({ success: false, message: 'Planner entry not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
