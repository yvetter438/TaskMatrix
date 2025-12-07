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
	const startTime = Date.now();
	console.log('🔔 OAuth callback received at', new Date().toISOString());
	console.log('  Query params:', JSON.stringify(req.query));
	console.log('  Has code:', !!req.query.code);
	console.log('  Has error:', !!req.query.error, req.query.error || '');
	
	// Check for OAuth errors from Google
	if (req.query.error) {
		console.error('❌ Google returned error:', req.query.error);
		return res.redirect('/?error=' + encodeURIComponent(req.query.error));
	}
	
	if (!isOAuthConfigured && !isOAuthReady()) {
		console.log('❌ OAuth not configured');
		return res.redirect('/');
	}
	
	console.log('🔄 Starting passport.authenticate...');
	passport.authenticate('google', (err, user, info) => {
		const authTime = Date.now() - startTime;
		console.log(`⏱️ Passport authenticate completed in ${authTime}ms`);
		
		if (err) {
			console.error('❌ Auth error:', err.message || err);
			return next(err);
		}
		if (!user) {
			console.log('❌ No user returned from Google auth:', info?.message || 'Unknown reason');
			// Check if it's because of missing tasks permission
			if (info?.message && info.message.includes('Tasks permission')) {
				return res.redirect('/?error=missing_permission');
			}
			return res.redirect('/?error=auth_failed');
		}
		
		console.log('✅ User authenticated:', user.displayName);
		console.log('🔄 Starting req.login...');
		
		// Manually log in and save session before redirect
		req.login(user, (loginErr) => {
			const loginTime = Date.now() - startTime;
			console.log(`⏱️ req.login completed in ${loginTime}ms`);
			
			if (loginErr) {
				console.error('❌ Login error:', loginErr.message || loginErr);
				return next(loginErr);
			}
			
			console.log('🔄 Saving session...');
			// Explicitly save session to Redis before redirect
			req.session.save((saveErr) => {
				const totalTime = Date.now() - startTime;
				console.log(`⏱️ Session save completed in ${totalTime}ms`);
				
				if (saveErr) {
					console.error('❌ Session save error:', saveErr.message || saveErr);
					return next(saveErr);
				}
				console.log('✅ User logged in successfully, session saved. Total time:', totalTime + 'ms');
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
