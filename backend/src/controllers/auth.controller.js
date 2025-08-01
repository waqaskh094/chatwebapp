import User from "../models/user.model.js"
import bcrypt from "bcryptjs"

import {generateToken} from "../lib/utils.js"
import cloudinary from "../lib/cloudinary.js"

export const signup = async (req, res) => {
    console.log("in auth contorller");
    const { fullName, email, password } = req.body;
    console.log(fullName);
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }

        const user = await User.findOne({email});

        if(user) return res.status(400).json({message: "Email already exists"});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        })

        if(newUser){
            //generate jwt token here
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });

        }
        else{
            res.status(400).json({message: "Invalid User data"});
        }

    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    const {email, password} = req.body;
    try {
        if(!email || !password) {
            return res.status(400).json({ message: "All fields are required"});
        }

        const user = await User.findOne({email});
        
        if(!user)
            return res.status(400).json({ message: "Credentails entered are wrong"});

        const isPasswordcorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordcorrect)            
            return res.status(400).json({ message: "Credentails entered are wrong"});

        generateToken(user._id, res);

        res.status(200).json({
            _id:user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        })

    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: "Internal Server Error"});
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge:0});
        res.status(200).json({ message: "Logged out successfully"});
    } catch (error) {
        console.log("Error in logout contorller", error.message);
        res.status(500).json({ message: "Internal Server Error "});
    }
}

export const updateProfile = async(req, res) => {
    try{
        const {profilePic} = req.body;
        const userId = req.user._id;

        if(!profilePic){
            return res.status(400).json({ message: "Profile Pic is required"});
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url}, {new:true});

        res.status(200).json(updatedUser)
    }
    catch(error){
        console.log("Error in Update Profile", error);
        res.status(400).json({ message: "Internal Server Error "});
    }
}

export const checkAuth = async(req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth Controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
        
    }
}