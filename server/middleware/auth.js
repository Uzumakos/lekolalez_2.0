import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-me');
    console.log('Decoded token:', decoded);

    req.user = await User.findById(decoded.id).select('-password');
    console.log('Found user:', req.user ? { id: req.user._id, role: req.user.role } : 'null');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    console.log('Auth error:', error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

export const instructor = (req, res, next) => {
  console.log('Instructor check - user:', req.user ? { id: req.user._id, role: req.user.role } : 'null');
  if (req.user && (req.user.role === 'instructor' || req.user.role === 'admin')) {
    next();
  } else {
    console.log('Instructor check FAILED - role is:', req.user?.role);
    res.status(403).json({ message: 'Not authorized as instructor' });
  }
};

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-change-me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};
