const express = require('express');
const session = require('express-session');
const path = require('path');
const layouts = require('express-ejs-layouts');
const dotenv = require('dotenv');
dotenv.config();

const { configurePassport, passport } = require('./config/passport');

async function startServer() {
	// Session store setup: Redis for production, FileStore for local dev
	let sessionStore;
	
	if (process.env.REDIS_URL) {
		// Production: Use Redis (Render's Key Value Store)
		const RedisStore = require('connect-redis').default;
		const { createClient } = require('redis');
		
		const redisClient = createClient({ 
			url: process.env.REDIS_URL,
			socket: {
				connectTimeout: 10000,
				reconnectStrategy: (retries) => Math.min(retries * 50, 500)
			}
		});
		
		redisClient.on('error', (err) => {
			console.error('❌ Redis Client Error:', err);
		});
		
		// Wait for Redis to connect before starting server
		try {
			await redisClient.connect();
			console.log('✅ Redis connected successfully');
		} catch (err) {
			console.error('❌ Redis connection failed:', err);
			process.exit(1);
		}
		
		sessionStore = new RedisStore({ 
			client: redisClient,
			prefix: 'taskmatrix:',
		});
		console.log('✅ Using Redis session store (production)');
	} else {
		// Local development: Use file-based sessions
		const FileStore = require('session-file-store')(session);
		sessionStore = new FileStore({
			path: './sessions',
			ttl: 30 * 24 * 60 * 60, // 30 days
			retries: 0,
		});
		console.log('✅ Using FileStore session store (development)');
	}

	const app = express();

	// Views and static
	app.set('view engine', 'ejs');
	app.set('views', path.join(__dirname, 'views'));
	app.set('layout', 'layout');
	app.use(layouts);
	app.use('/public', express.static(path.join(__dirname, 'public')));

	// Sessions - Now with proper store
	app.use(
		session({
			store: sessionStore,
			secret: process.env.SESSION_SECRET || 'dev_session_secret_change_me',
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: process.env.NODE_ENV === 'production',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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
}

startServer().catch((err) => {
	console.error('Failed to start server:', err);
	process.exit(1);
});
