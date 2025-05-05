import express from 'express';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { RedisStore } from 'connect-redis';
import { createAdapter } from '@socket.io/redis-adapter';
import passportGoogle from 'passport-google-oauth20';
import passportGithub from 'passport-github2';
import { sequelize, User, MetaSyncToken, SocialAccount } from './models.js';
import defineApis from './apis.js';
import defineSocketEvents from './socket-events.js';
const GoogleStrategy = passportGoogle.Strategy;
const GithubStrategy = passportGithub.Strategy;

const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const REDIS_URL = process.env.REDIS_URL;
const CLIENT_URL = process.env.CLIENT_URL;
const SERVER_URL = process.env.SERVER_URL;
const isLocal = CLIENT_URL === 'localhost:8000';

const corsOptions = {
    origin: ['https://' + CLIENT_URL],
    credentials: true,
    optionsSuccessStatus: 200,
};
if (isLocal) {
    corsOptions.origin.push('https://127.0.0.1:8000');
}
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: corsOptions,
});
const redisClient = new Redis(REDIS_URL);
const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();
const redisStore = new RedisStore({ client: redisClient, prefix: 'sess:' });
io.adapter(createAdapter(pubClient, subClient));

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    store: redisStore,
    resave: false,
    secret: SECRET_KEY,
    proxy: true,
    saveUninitialized: false,
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

io.engine.use(sessionMiddleware);

async function handleSocialLogin(req, profile, done) {
    const provider = profile.provider;
    const providerId = profile.id;
    const email = profile.emails?.[0]?.value || null;
    const socialAccount = await SocialAccount.findOne({ where: { provider, providerId } });
    if (req.user && req.session.link) {
        if (!socialAccount) {
            await SocialAccount.create({ provider, providerId, userId: req.user.id, email });
        } else if (!socialAccount.userId) {
            await socialAccount.update({ userId: req.user.id });
        } else {
            return done({ message: 'このアカウントはすでに他のユーザと連携されています。' }, null);
        }
        return done(null, req.user);
    }
    if (!socialAccount) {
        const user = await User.create({ name: profile.displayName });
        await SocialAccount.create({ provider, providerId, userId: user.id, email });
        return done(null, user);
    } else if (!socialAccount.userId) {
        const user = await User.create({ name: profile.displayName });
        await socialAccount.update({ userId: user.id });
        return done(null, user);
    }
    const user = await User.findByPk(socialAccount.userId);
    return done(null, user);
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `https://${SERVER_URL}/auth/google/callback`,
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        await handleSocialLogin(req, profile, done);
    } catch (error) {
        return done(error, null);
    }
}));

passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `https://${SERVER_URL}/auth/github/callback`,
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        await handleSocialLogin(req, profile, done);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser(async (user, done) => {
    done(null, user);
});

defineApis(app, passport, io, redisClient, redisStore);
defineSocketEvents(io, redisClient);

async function migrate() {
    let tokens = await MetaSyncToken.findAll();
    if (tokens.length) {
        console.log('Database synchronization is skipped.');
        return;
    }
    await redisClient.flushdb();
    const tokenId = await MetaSyncToken.create().then((token) => token.id);
    tokens = await MetaSyncToken.findAll({
        limit: 1,
        order: [[ 'createdAt', 'ASC' ]]
    });
    if (tokens[0].id !== tokenId) {
        await MetaSyncToken.destroy({ where: { id: tokenId } });
        console.log('Database synchronization is skipped.');
        return;
    }
    await sequelize.sync({ alter: true });
    await MetaSyncToken.destroy({ where: {} });
    console.log('Database synchronized successfully.');
}

async function run() {
    try {
        await migrate();
        httpServer.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error synchronizing database:', error);
        await sequelize.close();
    }
};

run();
