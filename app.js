const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt")
const User = require("./src/models/user.model.js")
const authMiddleware = require("./src/middlewares/auth.middleware.js")
const jwt = require("jsonwebtoken");
const Product = require("./src/models/product.model.js")
const sendResponse = require("./src/utils/sendResponse.js");


const app = express();

//connection of mongoDB
mongoose.connect("mongodb://localhost:27017/authdemo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

//Build a server
const PORT= 3000;
app.listen(PORT, ()=>{
    console.log("server is running on port", PORT)
})

//some middleware
app.use(express.json());
app.use(cookieParser());

//signUp 
app.post('/signup',async(req, res)=>{
    try{
        const{username, email, password} = req.body;
        if (!(username && email && password)) {
            // return res.status(400).send("username, email and password are required");
            return sendResponse(res,false,"username, email and password are required",null,400);
        }
        //finding a email in database if it found login is required
        //Check if user already exists
        const existingUser = await User.findOne({email})
        if(existingUser){
            // return res.status(409).send("User is already registerd please login")
            return sendResponse(res,false,"User is already registerd please login",null,409);
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //now i will store in database or create a User
        const user = User.create({
            username: username,
            password:hashedPassword,
            email:email
        });

        if(!user){
            // return res.status(401).send("something wrong when user is created")
            return sendResponse(res,false,"something wrong when user is created",null,401);
        }

        // res.status(201).json({
        //     message: "User created successfully",
        //     userId: user._id,
        // });
        return sendResponse(res,true,"User created successfully",user._id,201);


    }catch(err){
        console.error(error);
        // return res.status(500).send("Internal Server Error");
        return sendResponse(res,false,"Internal Server Error",null,500);
    }
})

//login part 
app.post('/login', async(req, res)=>{
    try{
        const{email, password}= req.body
        if(!(email && password)){
            // return res.status(400).send("Email and Password is required");
            return sendResponse(res,false,"Email and Password is required",null,400);

        }

        //finding email in database
        const existingUser = await User.findOne({email})
        if(!existingUser){
            // return res.status(401).send("user is not registered please register");
            return sendResponse(res,false,"user is not registered please register",null,401);

        }

        // comapre password 
        const validPassword = await bcrypt.compare(password,existingUser.password) // complete it
       
        if(!validPassword){
            // return res.status(401).send("password is incorrect")
            return sendResponse(res,false,"password is incorrect",null,401);

        }

        // create a json Web token 
        const jwtToken = jwt.sign(
            {userId: existingUser._id},
            process.env.JWT_SECRET_KEY,
            {expiresIn:"1h"}
        );  

        // send token in cookie or header
        res.cookie("jwtToken",jwtToken, {
            httpOnly: true,       // JS se access na ho
            secure: false,        // true in production with HTTPS
            sameSite: "strict",   // CSRF attack safe
            maxAge: 60 * 60 * 1000 // 1 hour
        });
        // return res.status(200).json({
        //     message: "Login successful",
        // });
        return sendResponse(res,true,"Login successful",existingUser,200);

    }catch(error){
        console.log(error)
        // return res.status(500).send("Internal Server Error");
        return sendResponse(res,false,"Internal Server Error",null,500);

    }
})

//logout Part
app.post("/logout", (req, res) => {
    res.clearCookie("jwtToken");
    // return res.status(200).send("Logout successful");
    return sendResponse(res,true,"Logout successful",null,200);

  });

 // Dashboard part  
app.get("/dashboard", authMiddleware, (req, res) => {
    // res.send(`Welcome User: ${req.user.userId}`);
    sendResponse(res,true,"Welcome User:",req.user.userId,200);
  });


// ----------------------------- Products fetch from database  
app.get("/product", async(req,res)=> {
    try {
        const {page = 1, limit=5, category} = req.query;
        const query = category ? {category}: {};

        const products = await Product.find({query})
        .skip((page-1)*limit)
        .limit(Number(limit))

        const total = await Product.countDocuments(query);

        return sendResponse(res, true, "Products fetched", {
            total,
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            products
        }, 200);

    } catch (error) {
        console.error(error);
        return sendResponse(res, false, "Error fetching products", null, 500);
    }
})


