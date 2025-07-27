const express=require("express");
const cors=require("cors");
require("dotenv").config();
const mongoose=require("mongoose");
mongoose.connect(process.env.LOCAL_MONGO_URI).then(()=>console.log("MonngoDB connected")).catch((err)=>console.log(err))

const app=express();
app.use(express.json());
app.use(cors());
require("./src/config/passport"); 

app.get("/",(req,res)=>{
    res.send("welcome")
})

const authRoutes = require("./src/routes/auth.routes");
app.use("/api/auth", authRoutes);





const Port =process.env.PORT||5000;

app.listen(Port,()=>console.log(`Server is running on ${Port}`))
