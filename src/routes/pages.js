const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => {
	// If user is already authenticated, redirect to dashboard
	if (req.isAuthenticated && req.isAuthenticated()) {
		return res.redirect('/dashboard');
	}
	res.render('landing', { title: 'Task Matrix' });
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
	res.render('dashboard', { title: 'Task Matrix' });
});

module.exports = router;
