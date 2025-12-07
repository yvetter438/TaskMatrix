const express = require('express');
const session = require('express-session');
const path = require('path');
const layouts = require('express-ejs-layouts');
const dotenv = require('dotenv');
dotenv.config();

const { configurePassport, passport } = require('./config/passport');

// Global Redis client for reuse across serverless invocations
let redisClient = null;
let sessionStore = null;

async function getSessionStore() {
	// Return existing store if already initialized (for serverless reuse)
	if (sessionStore) {
		return sessionStore;
	}

	// On Vercel serverless, skip Redis entirely and use memory store
	// Sessions won't persist between function invocations, but we handle that in the auth flow
	if (process.env.VERCEL) {
		console.log('⚠️ Vercel detected - using MemoryStore (sessions are ephemeral)');
		return null; // null = MemoryStore
	}

	// Session store setup: Redis for production (Render), FileStore for local dev
	if (process.env.REDIS_URL) {
		// Production: Use Redis (for Render or other persistent hosting)
		const RedisStore = require('connect-redis').default;
		const { createClient } = require('redis');
		
		// Reuse existing client if available
		if (!redisClient) {
			redisClient = createClient({ 
				url: process.env.REDIS_URL,
				socket: {
					connectTimeout: 5000,
					reconnectStrategy: false
				}
			});
			
			redisClient.on('error', (err) => {
				console.error('❌ Redis Client Error:', err);
			});
			
			try {
				if (!redisClient.isOpen && !redisClient.isReady) {
					await redisClient.connect();
					console.log('✅ Redis connected successfully');
				} else if (redisClient.isReady) {
					console.log('✅ Redis already connected');
				}
			} catch (err) {
				console.error('❌ Redis connection failed:', err);
				console.warn('⚠️ Falling back to memory store - Redis connection failed');
				redisClient = null;
				return null;
			}
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
	
	return sessionStore;
}

async function createApp() {
	const app = express();
	
	// Trust proxy - Required for secure cookies behind Vercel's proxy
	app.set('trust proxy', 1);

	// Views and static
	app.set('view engine', 'ejs');
	app.set('views', path.join(__dirname, 'views'));
	app.set('layout', 'layout');
	app.use(layouts);
	
	// Static files - ensure absolute path for serverless
	const publicPath = path.join(__dirname, 'public');
	console.log('📁 Serving static files from:', publicPath);
	app.use('/public', express.static(publicPath, {
		maxAge: '1y',
		etag: true
	}));

	// Sessions - Get store (may be async)
	const store = await getSessionStore();
	const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
	
	app.use(
		session({
			store: store, // null = MemoryStore (fallback)
			secret: process.env.SESSION_SECRET || 'dev_session_secret_change_me',
			resave: false,
			saveUninitialized: false,
			name: 'taskmatrix.sid',
			cookie: {
				secure: isProduction,
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			},
		})
	);
	
	// Debug logging for sessions in production
	if (isProduction) {
		app.use((req, res, next) => {
			console.log('Session ID:', req.sessionID);
			console.log('Is Authenticated:', req.isAuthenticated ? req.isAuthenticated() : false);
			next();
		});
	}

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

	return app;
}

// For Vercel serverless: export the handler
if (process.env.VERCEL) {
	// Serverless mode - export async handler
	let appInstance = null;
	
	module.exports = async (req, res) => {
		if (!appInstance) {
			appInstance = await createApp();
		}
		return appInstance(req, res);
	};
} else {
	// Render or local development mode - start server
	createApp().then(app => {
		const port = process.env.PORT || 3000;
		app.listen(port, () => {
			console.log(`Server listening on http://localhost:${port}`);
		});
	}).catch((err) => {
		console.error('❌ Failed to start server:', err);
		console.error('Error stack:', err.stack);
		// On Render, don't exit immediately - let it retry
		if (!process.env.RENDER) {
			process.exit(1);
		}
	});
}
