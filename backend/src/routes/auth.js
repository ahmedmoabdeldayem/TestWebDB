const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes' },
});

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.post('/logout',   logout);
router.get('/me',        requireAuth, me);

module.exports = router;
