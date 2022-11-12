import { challenge_response } from "../models/challenge_response.model";
import { dashboard_map_stat } from "../models/dashboard_map_stat.model";
import { mentor } from "../models/mentor.model";
import { organization } from "../models/organization.model";
import { team } from "../models/team.model";
import BaseService from "./base.service";

export default class DashboardService extends BaseService{

    async resetMapStats(){
        let uniqueDistricts: any;
        let bulkCreateArray: any = [];
        uniqueDistricts = await this.crudService.findAll(organization, { group: ["district"] });
        
        for (const district of uniqueDistricts) {
            if (district.district === null) {
                continue
            }
            const stats:any  = await this.getMapStatsForDistrict(district.dataValues.district)

            bulkCreateArray.push({
                overall_schools: stats.schoolIdsInDistrict.length,
                reg_schools: stats.registeredSchoolIdsInDistrict.length,
                teams: stats.teamIdInDistrict.length,
                ideas: stats.challengeInDistrict.length,
                district_name: district.district
            })
        }

        const statsForAllDistrics:any  = await this.getMapStatsForDistrict(null)

        bulkCreateArray.push({
            overall_schools: statsForAllDistrics.schoolIdsInDistrict.length,
            reg_schools: statsForAllDistrics.registeredSchoolIdsInDistrict.length,
            teams: statsForAllDistrics.teamIdInDistrict.length,
            ideas: statsForAllDistrics.challengeInDistrict.length,
            district_name: "all"
        })

        await this.crudService.delete(dashboard_map_stat, { where: {}, truncate: true });
        const result = await this.crudService.bulkCreate(dashboard_map_stat, bulkCreateArray);
        // console.log(result)
        return result;
    }

    async getMapStatsForDistrict(argdistric:any=null){

        let whereClause = {}
        if(argdistric){
            whereClause={ district: argdistric }
        }
        const overAllSchool = await this.crudService.findAll(organization, {
            where: whereClause
        });
        const schoolIdsInDistrict = overAllSchool.map((Element: any) => Element.dataValues.organization_code);

        const mentorReg = await this.crudService.findAll(mentor, {
            where: {
                organization_code: schoolIdsInDistrict
            }
        });
        const mentorIdInDistrict = mentorReg.map((Element: any) => Element.dataValues.mentor_id);//changed this to  user_id from mentor_id, because teams has mentor linked with team via user_id as value in the mentor_id collumn of the teams table
        const schoolRegistered = await this.crudService.findAll(mentor, {
            where: {
                mentor_id: mentorIdInDistrict,
            },
            group: ['organization_code']
        });
        const registeredSchoolIdsInDistrict = schoolRegistered.map((Element: any) => Element.dataValues.organization_code);
        const teamReg = await this.crudService.findAll(team, {
            where: { mentor_id: mentorIdInDistrict }
        });
        const teamIdInDistrict = teamReg.map((Element: any) => Element.dataValues.team_id);
        const challengeReg = await this.crudService.findAll(challenge_response, {
            where: { team_id: teamIdInDistrict }
        });
        const challengeInDistrict = challengeReg.map((Element: any) => Element.dataValues.challenge_response_id);
        return {
            schoolIdsInDistrict:schoolIdsInDistrict,
            registeredSchoolIdsInDistrict:registeredSchoolIdsInDistrict,
            teamIdInDistrict:teamIdInDistrict,
            challengeInDistrict:challengeInDistrict
        }
    }



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////  Dashboard student helpers....!!                 
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getDbLieralForAllToipcsCount(addWhereClauseStatusPart:any,whereClauseStatusPartLiteral:any){
        return  `
             select count(t.course_topic_id) 
             from course_topics as t
             where 
             ${addWhereClauseStatusPart?"t."+whereClauseStatusPartLiteral:whereClauseStatusPartLiteral}
             `
     }
     getDbLieralForAllToipcVideosCount(addWhereClauseStatusPart:any,whereClauseStatusPartLiteral:any){
         return this.getDbLieralForAllToipcsCount(addWhereClauseStatusPart,whereClauseStatusPartLiteral)+
         `and t.topic_type = "VIDEO"`
      }
     getDbLieralForAllToipcWorksheetCount(addWhereClauseStatusPart:any,whereClauseStatusPartLiteral:any){
     return this.getDbLieralForAllToipcsCount(addWhereClauseStatusPart,whereClauseStatusPartLiteral)+
     `and t.topic_type = "WORKSHEET"`
     }
     getDbLieralForAllToipcQuizCount(addWhereClauseStatusPart:any,whereClauseStatusPartLiteral:any){
     return this.getDbLieralForAllToipcsCount(addWhereClauseStatusPart,whereClauseStatusPartLiteral)+
     `and t.topic_type = "QUIZ"`
     }
     getDbLieralForAllToipcsCompletedCount(addWhereClauseStatusPart:any,whereClauseStatusPartLiteral:any){
         return  `
             select count(utp.user_id) 
             from user_topic_progress as utp
             join course_topics as t on t.course_topic_id=utp.course_topic_id
             where 
             ${addWhereClauseStatusPart?"t."+whereClauseStatusPartLiteral:whereClauseStatusPartLiteral}
             and utp.user_id=\`student\`.\`user_id\`
             `
      }
     getDbLieralForVideoToipcsCompletedCount(addWhereClauseStatusPart:any,whereClauseStatusPartLiteral:any){
         return this.getDbLieralForAllToipcsCompletedCount(addWhereClauseStatusPart,whereClauseStatusPartLiteral)+
         `and t.topic_type = "VIDEO"`
     }
     getDbLieralForWorksheetToipcsCompletedCount(addWhereClauseStatusPart:any,whereClauseStatusPartLiteral:any){
         return this.getDbLieralForAllToipcsCompletedCount(addWhereClauseStatusPart,whereClauseStatusPartLiteral)+
         `and t.topic_type = "WORKSHEET"`
     }
     getDbLieralForQuizToipcsCompletedCount(addWhereClauseStatusPart:any,whereClauseStatusPartLiteral:any){
         return this.getDbLieralForAllToipcsCompletedCount(addWhereClauseStatusPart,whereClauseStatusPartLiteral)+
         `and t.topic_type = "QUIZ"`
     }

}