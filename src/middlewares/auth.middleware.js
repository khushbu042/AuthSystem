const jwt = require("jsonwebtoken");
const sendResponse = require("../utils/sendResponse.js");

const authMiddleware = (req,res,next) => {
    const jwtToken = req.cookies.jwtToken;
    if(!jwtToken){
        // return res.status(402).send("Login First")
        return sendResponse(res, false, "Login first", null, 401);
    }

    try {
        const decoded = jwt.verify(jwtToken,process.env.JWT_SECRET_KEY)
        req.user = decoded;
        next();
    } catch (error) {
        console.log(error);
        // return res.status(401).send("Invalid token");
        return sendResponse(res, false, "Invalid or expired token", null, 401);
    }
}

module.exports = authMiddleware;