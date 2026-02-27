const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyAnyoneHasAccount = (req, res, next) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
        return res.status(403).json({ message: 'You must be logged in.' });
    }

    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired access token.' });
        }

        if (decoded && decoded.id && decoded.email && decoded.role) {
            if(decoded.role==="user" || decoded.role==="admin"){
                next();
            }else{
                return res.status(403).json({ message: 'Access denied, You should be loged in.' });
            }
            
        }
    });
}

module.exports = {
    verifyAnyoneHasAccount,
};