

const express = require('express');
const router = express.Router();

const { register, login, getPerfil } = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

router.post('/register', register);

router.post('/login', login);

router.get('/perfil', protect, getPerfil);
router.get('/me', protect, getPerfil);

module.exports = router;
