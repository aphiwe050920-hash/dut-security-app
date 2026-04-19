const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateProfile, updateLocation, deleteUser } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', protect, authorizeRoles('security', 'admin'), getUsers);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, updateProfile);
router.put('/location', protect, updateLocation);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

module.exports = router;