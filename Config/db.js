import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB= async()=>{
    try{
        console.log("MONGODB_URL:", process.env.MONGODB_URL);
const connect= await mongoose.connect(process.env.MONGODB_URL)
console.log("Mongodb connected successfully")
    

    }
    catch(error){
        console.error("Error connecting to MongoDB:", error);
    }
}
export default connectDB;