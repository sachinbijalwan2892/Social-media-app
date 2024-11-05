// middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key';

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(403);
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access Denied' });
        }
        next();
    };
}

module.exports = { authenticateToken, authorizeRoles };
