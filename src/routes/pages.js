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
	let errorMessage = null;
	if (error === 'auth_failed') {
		errorMessage = 'Authentication failed. Please try again.';
	} else if (error === 'missing_permission') {
		errorMessage = 'You must grant access to your Google Tasks for this app to work. Please try again and make sure to check the "Create, edit, organize, and delete all your tasks" permission.';
	}
	
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
