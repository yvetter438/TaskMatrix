const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => {
	// If user is already authenticated, redirect to dashboard
	if (req.isAuthenticated && req.isAuthenticated()) {
		return res.redirect('/dashboard');
	}
	
	// Check for authentication errors
	const error = req.query.error;
	const errorMessage = error === 'auth_failed' ? 'Authentication failed. Please try again.' : null;
	
	res.render('landing', { 
		title: 'Task Matrix',
		error: errorMessage 
	});
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
	res.render('dashboard', { title: 'Task Matrix' });
});

router.get('/privacy', (req, res) => {
	res.render('privacy', { title: 'Privacy Policy' });
});

router.get('/terms', (req, res) => {
	res.render('terms', { title: 'Terms of Service' });
});

module.exports = router;
