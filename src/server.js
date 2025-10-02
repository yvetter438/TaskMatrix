const express = require('express');
const session = require('express-session');
const path = require('path');
const layouts = require('express-ejs-layouts');
const dotenv = require('dotenv');
dotenv.config();

const { configurePassport, passport } = require('./config/passport');

const app = express();

// Views and static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(layouts);
app.use('/public', express.static(path.join(__dirname, 'public')));

// Sessions
const isProduction = process.env.NODE_ENV === 'production';
app.use(
	session({
		secret: process.env.SESSION_SECRET || 'dev_session_secret_change_me',
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: false, // Set to false for now to debug
			httpOnly: true,
			sameSite: 'lax',
		},
	})
);

// Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Globals for views
app.use((req, res, next) => {
	res.locals.user = req.user || null;
	res.locals.title = 'Task Matrix';
	next();
});

// Routes
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const tasksRoutes = require('./routes/tasks');
app.use(express.json());
app.use('/', pageRoutes);
app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});
