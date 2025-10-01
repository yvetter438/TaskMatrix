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
	const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
	const callbackURL = `${baseUrl}/auth/google/callback`;

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
		},
		(accessToken, refreshToken, profile, done) => {
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
