import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import SiteContent from '../models/SiteContent.js';

const router = express.Router();
const SiteContentData = SiteContent;

// @route   GET /api/site-content
// @desc    Get all site content
router.get('/', async (req, res) => {
  try {
    let content = await SiteContentData.findOne({ key: 'main' });

    if (!content) {
      // Return default content if none exists
      return res.json({
        content: null,
        isDefault: true
      });
    }

    res.json({ content });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/site-content
// @desc    Update all site content (admin only)
router.put('/', protect, admin, async (req, res) => {
  try {
    const { about, pricing, instructors, contact } = req.body;

    let content = await SiteContentData.findOne({ key: 'main' });

    if (content) {
      // Update existing
      content.about = about || content.about;
      content.pricing = pricing || content.pricing;
      content.instructors = instructors || content.instructors;
      content.contact = contact || content.contact;
      content.lastUpdatedBy = req.user._id;
      await content.save();
    } else {
      // Create new
      content = await SiteContentData.create({
        key: 'main',
        about,
        pricing,
        instructors,
        contact,
        lastUpdatedBy: req.user._id
      });
    }

    res.json({
      message: 'Site content updated successfully',
      content
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/site-content/:section
// @desc    Update specific section (admin only)
router.put('/:section', protect, admin, async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ['about', 'pricing', 'instructors', 'contact'];

    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    let content = await SiteContentData.findOne({ key: 'main' });

    if (!content) {
      content = await SiteContentData.create({ key: 'main' });
    }

    content[section] = req.body;
    content.lastUpdatedBy = req.user._id;
    await content.save();

    res.json({
      message: `${section} section updated successfully`,
      content
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
