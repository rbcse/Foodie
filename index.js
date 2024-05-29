import express from "express";
import axios from "axios";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import pg from "pg"
import nodemailer from "nodemailer";

const port = 3000;
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.listen(port,()=>{
    console.log("Server is ready");
});

app.get("/",(req,res)=>{
    res.render("index.ejs",{loginMessage:"Login/Signup",loginRoute:"/login"});
})

const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"user",
    password:"rahul",
    port:5432
})

db.connect();

app.get("/login",(req,res)=>{
    res.render("login.ejs",{error:""});
})

app.get("/signup",(req,res)=>{
    res.render("signup.ejs",{errorMessage:""});
})

app.post("/userRegister",async (req,res)=>{

    const fullName = req.body.fullName;
    const userEmail = req.body.eMail;
    const userPassword = req.body.passWord;
    const userPhone = req.body.pHone;
    const result = await db.query("SELECT * FROM userdata WHERE email=$1 AND user_password=$2",[userEmail,userPassword]);
    if(result.rows.length != 0){
        res.render("signup.ejs",{errorMessage:"User already exists"})
    }
    else{
        await db.query("INSERT INTO userdata (fullname,email,user_password,phone_no) VALUES ($1,$2,$3,$4)",[fullName,userEmail,userPassword,userPhone]);
        console.log("New user signed up");
        res.render("login.ejs",{error:"",loginRoute:"/login"});
    }

})

app.post("/userLogin",async (req,res)=>{

    try{
        const userEmail = req.body.userEmail;
        const userPassword = req.body.userPassword;
        const result = await db.query("SELECT * FROM userdata WHERE email=$1 AND user_password=$2",[userEmail,userPassword]);
        if(result.rows.length == 0){
            res.render("login.ejs",{error:"User doesn't exists , Please signup first"});
            console.log("User doesn't exists , Please signup first");
        }
        
        const loginEmail = result.rows[0].email;
        const loginPassword = result.rows[0].user_password;
        const userName = result.rows[0].fullname;
    
        if(userEmail == loginEmail && userPassword == loginPassword){
            console.log("Login Successful");
            res.render("index.ejs",{loginMessage:userName,loginRoute:"/"});
        }
    }
    catch(err){
        res.render("login.ejs",{error:"Invalid credentials"});
    }

})

const p = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"Image",
    password:"rahul",
    port:5432
})
p.connect();

app.get("/form",(req,res)=>{
    res.render("form.ejs");
})

app.post("/addproduct",async (req,res)=>{
    const reqBody = req.body;
    const pName = reqBody.name;
    const Imgurl = reqBody.image_url;
    const description = reqBody.description;
    const price = reqBody.price;
    const rating = reqBody.rating;
    const category = reqBody.category;

    try{
        await p.query("INSERT INTO products (name,image_url,description,price,rating,category) VALUES ($1,$2,$3,$4,$5,$6)",[pName,Imgurl,description,price,rating,category]);
        res.render("form.ejs");
    }
    catch(err){
        console.log(err);
    }
})

let pdts = [];
app.get("/products",async (req,res)=>{
    const result = await p.query("SELECT * FROM products");
    const foodArr = result.rows;
    pdts = foodArr;
    res.render("products.ejs",{items:foodArr});
})

let currFood = "";

app.post("/foodSearch",async (req,res)=>{
    const foodName = (req.body.searchFood).toLowerCase();
    currFood = foodName;
    if(currFood == "Select Food"){
        currFood = "";
    }
    try{
        const result = await p.query("SELECT * FROM products where category = $1",[foodName]);
        const foodArr = result.rows;
        res.render("products.ejs",{items:foodArr});
    }
    catch(err){
        console.log(err);
    }
})
app.post("/searchfoodHome",async (req,res)=>{
    const foodName = (req.body.search_input).toLowerCase();
    currFood = foodName;
    try{
        const result = await p.query("SELECT * FROM products where category = $1",[foodName]);
        const foodArr = result.rows;
        pdts = foodArr;
        res.render("products.ejs",{items:foodArr});
    }
    catch(err){
        console.log(err);
    }
})

app.post("/contact",(req,res)=>{


    const email = req.body.email;
    const fullName = req.body.fullname;
    const message = req.body.message;
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'rahuljain10159@gmail.com',
            pass: 'rrof royz gmgp imsp'
        }
    });

    var mailOptions = {
        from: `${email}`,
        to: 'rahuljain10159@gmail.com',
        subject: `${fullName}`,
        text: `${message}`
    };

    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
    });

    res.render("index.ejs",{loginRoute:"/login",loginMessage:"Login/Signup"});

})

app.get("/rating4plus",async (req,res)=>{

    try{
        if(currFood == ""){
            const result = await p.query("SELECT * FROM products where rating >= 4.0");
            const foodArr = result.rows;
            res.render("products.ejs",{items:foodArr});
        }
        else{
            try{
                const result = await p.query("SELECT * FROM products where category = $1 and rating >= 4.0",[currFood]);
                const foodArr = result.rows;
                currFood = "";
                res.render("products.ejs",{items:foodArr});
            }
            catch(err){
                console.log(err);
            }
        }
        
    }
    catch(err){
        console.log(err);
    }

});

app.post("/searchfoodBtn",async (req,res)=>{
    currFood = (req.body.input_btn).toLowerCase();
    console.log(currFood);
    try{
        const result = await p.query("SELECT * FROM products where category = $1",[currFood]);
        const foodArr = result.rows;
        res.render("products.ejs",{items:foodArr});
    }
    catch(err){
        console.log(err);
    }
})

app.get("/getItemId", async (req, res) => {
    const itemId = req.query.itemId;  
    const actualId = pdts[itemId].id;
    const result = await p.query("SELECT * FROM products where id = $1",[actualId]);
    res.render("seeproduct.ejs",{pdt:result.rows[0]});
});


let cart = [];

app.post("/addtoCart",(req,res)=>{
    let obj = {
        pdtImg : req.body.pdtImg,
        pdtName : req.body.pdtName,
        pdtDesc : req.body.pdtDesc,
        pdtQt : req.body.pdtQt,
        pdtPrice: req.body.pdtPrice
    }
    cart.push(obj);
    res.render("products.ejs",{items:pdts});
});

app.post("/gotoCart",(req,res)=>{
    let totalAmt = 0;
    cart.forEach((product)=>{
        totalAmt += (Number(product.pdtQt) * Number(product.pdtPrice));
    })
    res.render("checkout.ejs",{cartItems:cart , totalAmt:totalAmt});
})
app.get("/gotoCart",(req,res)=>{
    let totalAmt = 0;
    cart.forEach((product)=>{
        totalAmt += (Number(product.pdtQt) * Number(product.pdtPrice));
    })
    res.render("checkout.ejs",{cartItems:cart , totalAmt:totalAmt});
})

app.post("/removefromCart",(req,res)=>{
    let n = cart.length;
    let tempObj = cart[req.body.removeId];
    let lastObj = cart[n-1];
    cart[n-1] = tempObj;
    cart[req.body.removeId] = lastObj;
    cart.pop();
    let totalAmt = 0;
    cart.forEach((product)=>{
        totalAmt += (Number(product.pdtQt) * Number(product.pdtPrice));
    })
    res.render("checkout.ejs",{cartItems:cart , totalAmt:totalAmt});
});

app.get("/addmore",async (req,res)=>{
    pdts = await (await p.query("SELECT * FROM products")).rows;
    res.render("products.ejs",{items:pdts});
})

// Razorpay integration

var instance = new Razorpay({
    key_id: 'rzp_test_3iOCKgVRiHQapy',
    key_secret: 'cK0mxg3shecsC2TQ4IbVGXr8',
});

import Razorpay from "razorpay";

