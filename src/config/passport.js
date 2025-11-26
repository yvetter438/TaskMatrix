const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// In a real app, you would persist the user. For now, keep the profile minimal in session.
passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});

let isOAuthConfigured = false;

function configurePassport() {
	const clientID = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	// Ensure BASE_URL doesn't have trailing slash
	let baseUrl = process.env.BASE_URL || 'http://localhost:3000';
	baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
	const callbackURL = `${baseUrl}/auth/google/callback`;

	console.log('🔐 OAuth Configuration:');
	console.log('  BASE_URL:', baseUrl);
	console.log('  Callback URL:', callbackURL);
	console.log('  Client ID:', clientID ? `${clientID.substring(0, 20)}...` : 'NOT SET');

	if (!clientID || !clientSecret) {
		console.warn('Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set. OAuth is disabled.');
		isOAuthConfigured = false;
		return passport;
	}

	passport.use(new GoogleStrategy(
		{
			clientID,
			clientSecret,
			callbackURL,
			passReqToCallback: true,
		},
		(req, accessToken, refreshToken, profile, done) => {
			// Check if the required scope was granted
			const grantedScopes = req.query.scope || '';
			const hasTasksScope = grantedScopes.includes('https://www.googleapis.com/auth/tasks');
			
			if (!hasTasksScope) {
				// User didn't grant tasks permission - fail authentication
				return done(null, false, { message: 'Tasks permission is required for this app to work' });
			}
			
			const user = {
				id: profile.id,
				displayName: profile.displayName,
				emails: profile.emails,
				photos: profile.photos,
				googleAccessToken: accessToken,
				googleRefreshToken: refreshToken,
			};
			return done(null, user);
		}
	));

	isOAuthConfigured = true;
	return passport;
}

module.exports = { configurePassport, passport, isOAuthConfigured };
// Return the live readiness state based on whether the Google strategy is registered
function isOAuthReady() {
	try {
		return Boolean(passport._strategies && passport._strategies.google);
	} catch (e) {
		return false;
	}
}

module.exports.isOAuthReady = isOAuthReady;
