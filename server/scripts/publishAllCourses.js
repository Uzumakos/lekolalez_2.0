// Script to publish all unpublished courses
// Run with: node server/scripts/publishAllCourses.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const courseSchema = new mongoose.Schema({
  title: String,
  isPublished: Boolean,
  status: String
}, { strict: false });

const Course = mongoose.model('Course', courseSchema);

async function publishAllCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all unpublished courses
    const unpublishedCourses = await Course.find({
      $or: [
        { isPublished: false },
        { isPublished: { $exists: false } },
        { status: 'draft' },
        { status: { $exists: false } }
      ]
    });

    console.log(`Found ${unpublishedCourses.length} unpublished courses`);

    // Update each course to be published
    for (const course of unpublishedCourses) {
      await Course.findByIdAndUpdate(course._id, {
        isPublished: true,
        status: 'published',
        publishedAt: new Date()
      });
      console.log(`Published: ${course.title}`);
    }

    console.log('All courses have been published!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

publishAllCourses();
