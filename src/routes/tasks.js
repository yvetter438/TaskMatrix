const express = require('express');
const { google } = require('googleapis');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

function getTasksClient(req) {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const redirectUri = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/google/callback`;

	const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
	// Use tokens from session (set during OAuth callback)
	oauth2Client.setCredentials({
		access_token: req.user.googleAccessToken,
		refresh_token: req.user.googleRefreshToken,
	});

	return google.tasks({ version: 'v1', auth: oauth2Client });
}

// List task lists
router.get('/lists', ensureAuthenticated, async (req, res, next) => {
	try {
		const tasks = getTasksClient(req);
		const { data } = await tasks.tasklists.list({ maxResults: 50 });
		res.json(data);
	} catch (err) {
		next(err);
	}
});

// List tasks in a list
router.get('/:listId', ensureAuthenticated, async (req, res, next) => {
	try {
		const tasks = getTasksClient(req);
		const { data } = await tasks.tasks.list({ tasklist: req.params.listId, showCompleted: true });
		res.json(data);
	} catch (err) {
		next(err);
	}
});

// Create a task
router.post('/:listId', ensureAuthenticated, async (req, res, next) => {
	try {
		const tasks = getTasksClient(req);
		const { title, notes, due, starred } = req.body || {};
		const { data } = await tasks.tasks.insert({
			tasklist: req.params.listId,
			requestBody: { title, notes, due, starred },
		});
		res.status(201).json(data);
	} catch (err) {
		next(err);
	}
});

// Update a task (patch)
router.patch('/:listId/:taskId', ensureAuthenticated, async (req, res, next) => {
	try {
		const tasks = getTasksClient(req);
		const { data } = await tasks.tasks.patch({
			tasklist: req.params.listId,
			task: req.params.taskId,
			requestBody: req.body || {},
		});
		res.json(data);
	} catch (err) {
		next(err);
	}
});

// Complete a task (sets status=completed)
router.post('/:listId/:taskId/complete', ensureAuthenticated, async (req, res, next) => {
	try {
		const tasks = getTasksClient(req);
		const { data } = await tasks.tasks.patch({
			tasklist: req.params.listId,
			task: req.params.taskId,
			requestBody: { status: 'completed', completed: new Date().toISOString() },
		});
		res.json(data);
	} catch (err) {
		next(err);
	}
});

// Delete a task
router.delete('/:listId/:taskId', ensureAuthenticated, async (req, res, next) => {
	try {
		const tasks = getTasksClient(req);
		await tasks.tasks.delete({ tasklist: req.params.listId, task: req.params.taskId });
		res.status(204).end();
	} catch (err) {
		next(err);
	}
});

module.exports = router;


