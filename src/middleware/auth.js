function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated && req.isAuthenticated()) {
		return next();
	}
	return res.redirect('/');
}

module.exports = { ensureAuthenticated };
