import { User, SocialAccount } from './models.js';

export default function defineApis(app, passport, io, redisClient, redisStore) {
    const CLIENT_URL = process.env.CLIENT_URL;
    const isAuthenticated = (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ message: 'Unauthorized' });
    };

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

    app.get('/auth/link/google', isAuthenticated, (req, res, next) => {
        req.session.link = true;
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    });

    app.get('/auth/link/github', isAuthenticated, (req, res, next) => {
        req.session.link = true;
        passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
    });

    function handleAuthCallback(provider) {
        return (req, res, next) => {
            passport.authenticate(provider, async (err, user) => {
                if (req.user && req.session.link && err) {
                    res.redirect(`https://${CLIENT_URL}/profile/?error=${err.message}`);
                } else if (req.user && req.session.link) {
                    res.redirect(`https://${CLIENT_URL}/profile/`);
                } else {
                    const oldSessionId = await redisClient.get(`user_session:${user.id}`);
                    if (oldSessionId) {
                        await redisStore.destroy(oldSessionId);
                        io.in(`user:${user.id}`).disconnectSockets();
                    }
                    req.logIn(user, async () => {
                        await redisClient.set(`user_session:${user.id}`, req.sessionID);
                        res.redirect(`https://${CLIENT_URL}/`);
                    });
                }
            })(req, res, next);
        };
    }

    app.get('/auth/google/callback', handleAuthCallback('google'));
    app.get('/auth/github/callback', handleAuthCallback('github'));

    app.get('/auth/unlink/:id', isAuthenticated, async (req, res) => {
        const socialAccountId = req.params.id;
        try {
            const socialAccounts = await SocialAccount.findAll({ where: { userId: req.user.id } });
            if (socialAccounts.length <= 1) {
                return res.status(400).json({ message: 'At least one social account is required' });
            }
            await SocialAccount.update({ userId: null }, { where: { id: socialAccountId, userId: req.user.id } });
            res.json({ message: 'Unlinked successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to unlink social account' });
        }
    });

    app.get('/auth/logout', (req, res) => {
        const userId = req.user.id;
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: 'Logout failed' });
            }
            req.session.destroy(() => {
                io.in(`user:${userId}`).disconnectSockets();
            });
            res.json({ message: 'Logged out successfully' });
        });
    });

    app.get('/username', isAuthenticated, (req, res) => {
        res.json({ userId: req.user.id, userName: req.user.name });
    });

    app.get('/profile', isAuthenticated, async (req, res) => {
        const user = await User.findByPk(req.user.id);
        const socialAccounts = await user.getSocialAccounts().then((socialAccounts) => {
            return socialAccounts.map((socialAccount) => {
                return {
                    id: socialAccount.id,
                    provider: socialAccount.provider,
                    email: socialAccount.email,
                };
            });
        });
        res.json({ name: user.name, socialAccounts });
    });

    app.get('/', isAuthenticated, (req, res) => {
        res.json({
            'message': `root dayo: query is q=${req.query.q}`
        });
    });

    app.get('/error', isAuthenticated, (req, res) => {
        res.status(400).json({
            'message': 'errorのテスト'
        });
    });

    app.get('/data/:id', isAuthenticated, (req, res) => {
        res.json({
            'message': `data dayo: path param is id=${req.params.id}`
        });
    });

    app.post('/modify', isAuthenticated, (req, res) => {
        res.json({
            'message': `success!!! new data is ${req.body.data}`,
        });
    });
}
