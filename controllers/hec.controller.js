import { loginUser } from "./user.controller.js";
import db from "../config/database.js";


const sendMessage = async(req,res)=>{
    const userEmail=req.session.userEmail;
    const role = req.session.role;
    if(role==="student"|| userEmail==="hec@rguktinfosnity.ac.in"){
        const {message} = req.body;
        try{
            await db.query("insert into hecmessages (fromemail,messages) values($1,$2)",[userEmail,message]);
            res.json({message:true,sucessMessage:"sent sucessfully"});
        }catch(error){
            console.log(error);
            res.json("error");
        }
    }
}
const getAllMessages = async(req,res)=>{
    const userEmail = req.session.userEmail;
    const role = req.session.role;
    if(role==="student" || userEmail==="hec@rguktinfosnity.ac.in"){
        try{
            const result = await db.query("select * from hecmessages ");
            res.json({message:true,result:result.rows});
        }catch(error){
            console.log(error);
            res.json(error);
        }
    }else{
        res.json("nothing to see here");
    }
}

export {sendMessage,getAllMessages};