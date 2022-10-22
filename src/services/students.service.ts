import { badRequest, internal, unauthorized } from "boom";
import { Op } from "sequelize";
import { constents } from "../configs/constents.config";
import { speeches } from "../configs/speeches.config";
import { course_topic } from "../models/course_topic.model";
import { reflective_quiz_question } from "../models/reflective_quiz_question.model";
import { reflective_quiz_response } from "../models/reflective_quiz_response.model";
import { student } from "../models/student.model";
import BaseService from "./base.service";
import CRUDService from "./crud.service";

export default class StudentService extends BaseService{
    
    async getStudentBadges(student_user_id:any){
        try{
            
            if(!student_user_id){
                throw badRequest(speeches.USER_NOT_FOUND)
            }
            const studentResult = await student.findOne({
                where:{
                    user_id:student_user_id
                },
                attributes:[
                    'badges',
                ]
            })
            if(!studentResult){
                throw badRequest(speeches.USER_NOT_FOUND) 
            }
            if(studentResult instanceof Error){
                throw studentResult
            }
            
            //@ts-ignore
            const studentBadgesString = studentResult.dataValues.badges;
            
            const studentBadgesObj:any = JSON.parse(studentBadgesString);
            return studentBadgesObj
        }catch(err){
            return err
        }
    }

}


