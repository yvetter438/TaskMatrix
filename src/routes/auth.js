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
	
	passport.authenticate('google', (err, user, info) => {
		if (err) {
			console.error('Auth error:', err);
			return next(err);
		}
		if (!user) {
			console.log('No user returned from Google auth:', info?.message);
			// Check if it's because of missing tasks permission
			if (info?.message && info.message.includes('Tasks permission')) {
				return res.redirect('/?error=missing_permission');
			}
			return res.redirect('/?error=auth_failed');
		}
		
		// Manually log in and save session before redirect
		req.login(user, (loginErr) => {
			if (loginErr) {
				console.error('Login error:', loginErr);
				return next(loginErr);
			}
			
			// Explicitly save session to Redis before redirect
			req.session.save((saveErr) => {
				if (saveErr) {
					console.error('Session save error:', saveErr);
					return next(saveErr);
				}
				console.log('✅ User logged in successfully, session saved');
				return res.redirect('/dashboard');
			});
		});
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
