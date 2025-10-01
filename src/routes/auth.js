const express = require('express');
const router = express.Router();
const { passport, isOAuthConfigured, isOAuthReady } = require('../config/passport');


router.get('/google', (req, res, next) => {
	if (!isOAuthConfigured && !isOAuthReady()) {
		return res.status(503).send('OAuth not configured. Set GOOGLE_CLIENT_ID/SECRET.');
	}
	return passport.authenticate('google', {
		scope: ['profile', 'email', 'https://www.googleapis.com/auth/tasks'],
		accessType: 'offline',
		prompt: 'consent',
	})(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
	if (!isOAuthConfigured && !isOAuthReady()) {
		console.log('OAuth not configured');
		return res.redirect('/');
	}
	
	return passport.authenticate('google', {
		failureRedirect: '/?error=auth_failed',
		successRedirect: '/dashboard',
	})(req, res, next);
});

router.post('/logout', (req, res, next) => {
	if (req.logout) {
		req.logout(err => {
			if (err) return next(err);
			res.redirect('/');
		});
	} else {
		res.redirect('/');
	}
});

module.exports = router;
