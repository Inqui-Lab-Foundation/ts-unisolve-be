import { Request, Response, NextFunction } from 'express';
import { customAlphabet } from 'nanoid';

import { speeches } from '../configs/speeches.config';
import dispatcher from '../utils/dispatch.util';
import { studentSchema, studentLoginSchema, studentUpdateSchema, studentChangePasswordSchema, studentResetPasswordSchema } from '../validations/student.validationa';
import authService from '../services/auth.service';
import BaseController from './base.controller';
import ValidationsHolder from '../validations/validationHolder';
import validationMiddleware from '../middlewares/validation.middleware';
import { constents } from '../configs/constents.config';
import CryptoJS from 'crypto-js';
import { Op } from 'sequelize';
import { user } from '../models/user.model';
import { team } from '../models/team.model';
import { student } from '../models/student.model';
import StudentService from '../services/students.service';
import { badge } from '../models/badge.model';
import { mentor } from '../models/mentor.model';
import { organization } from '../models/organization.model';
import { badRequest, notFound } from 'boom';

export default class StudentController extends BaseController {
    model = "student";
    authService: authService = new authService;
    private password = process.env.GLOBAL_PASSWORD;
    private nanoid = customAlphabet('0123456789', 6);

    protected initializePath(): void {
        this.path = '/students';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(studentSchema, studentUpdateSchema);
    }
    protected initializeRoutes(): void {
        //example route to add
        //this.router.get(`${this.path}/`, this.getData);
        this.router.post(`${this.path}/register`, this.register.bind(this));
        this.router.post(`${this.path}/login`, validationMiddleware(studentLoginSchema), this.login.bind(this));
        this.router.get(`${this.path}/logout`, this.logout.bind(this));
        this.router.put(`${this.path}/changePassword`, validationMiddleware(studentChangePasswordSchema), this.changePassword.bind(this));
        // this.router.put(`${this.path}/updatePassword`, validationMiddleware(studentChangePasswordSchema), this.updatePassword.bind(this));
        this.router.put(`${this.path}/resetPassword`, validationMiddleware(studentResetPasswordSchema), this.resetPassword.bind(this));
        this.router.post(`${this.path}/:student_user_id/badges`, this.addBadgeToStudent.bind(this));
        this.router.get(`${this.path}/:student_user_id/badges`, this.getStudentBadges.bind(this));
        super.initializeRoutes();
    }
    private async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        const randomGeneratedSixDigitID = this.nanoid();
        const cryptoEncryptedString = await this.authService.generateCryptEncryption(randomGeneratedSixDigitID);

        const { team_id } = req.body;
        let trimmedTeamName: any;
        let trimmedStudentName: any;
        trimmedStudentName = req.body.full_name.replace(/[\n\r\s\t]+/g, '').toLowerCase();

        if (!req.body.role || req.body.role !== 'STUDENT') return res.status(406).send(dispatcher(res, null, 'error', speeches.USER_ROLE_REQUIRED, 406));
        if (!req.body.team_id) return res.status(406).send(dispatcher(res, null, 'error', speeches.USER_TEAMID_REQUIRED, 406));
        const teamDetails = await this.authService.crudService.findOne(team, { where: { team_id } });
        if (!teamDetails) return res.status(406).send(dispatcher(res, null, 'error', speeches.TEAM_NOT_FOUND, 406));
        else trimmedTeamName = teamDetails.dataValues.team_name.replace(/[\n\r\s\t\_]+/g, '').toLowerCase();
        if (!req.body.username || req.body.username === "") {
            req.body.username = trimmedTeamName + '_' + trimmedStudentName
            req.body['UUID'] = randomGeneratedSixDigitID;
            req.body.qualification = cryptoEncryptedString // saving the encrypted text in the qualification as for now just for debugging
        }
        if (!req.body.password || req.body.password === "") req.body.password = cryptoEncryptedString;
        console.log(req.body);
        const result = await this.authService.register(req.body);
        console.log(result);
        if (result.user_res) return res.status(406).send(dispatcher(res, result.user_res.dataValues, 'error', speeches.STUDENT_EXISTS, 406));
        return res.status(201).send(dispatcher(res, result.profile.dataValues, 'success', speeches.USER_REGISTERED_SUCCESSFULLY, 201));
    }
    private async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        let teamDetails: any;
        let studentDetails: any;
        let result;
        req.body['role'] = 'STUDENT'
        result = await this.authService.login(req.body);
        if (!result) {
            return res.status(404).send(dispatcher(res, result, 'error', speeches.USER_NOT_FOUND));
        } else if (result.error) {
            return res.status(401).send(dispatcher(res, result.error, 'error', speeches.USER_RISTRICTED, 401));
        } else {
            studentDetails = await this.authService.getServiceDetails('student', { user_id: result.data.user_id });
            teamDetails = await this.authService.getServiceDetails('team', { team_id: studentDetails.dataValues.team_id });
            result.data['team_id'] = studentDetails.dataValues.team_id;
            result.data['student_id'] = studentDetails.dataValues.student_id;
            if (!teamDetails) {
                result.data['mentor_id'] = null;
                result.data['team_name'] = null;
            } else {
                result.data['mentor_id'] = teamDetails.dataValues.mentor_id;
                result.data['team_name'] = teamDetails.dataValues.team_name;
            }
            return res.status(200).send(dispatcher(res, result.data, 'success', speeches.USER_LOGIN_SUCCESS));
        }
    }
    private async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        const result = await this.authService.logout(req.body, res);
        if (result.error) {
            next(result.error);
        } else {
            return res.status(200).send(dispatcher(res, speeches.LOGOUT_SUCCESS, 'success'));
        }
    }
    private async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        const result = await this.authService.changePassword(req.body, res);
        if (!result) {
            return res.status(404).send(dispatcher(res, null, 'error', speeches.USER_NOT_FOUND));
        } else if (result.error) {
            return res.status(404).send(dispatcher(res, result.error, 'error', result.error));
        }
        else if (result.match) {
            return res.status(404).send(dispatcher(res, null, 'error', speeches.USER_PASSWORD));
        } else {
            return res.status(202).send(dispatcher(res, result.data, 'accepted', speeches.USER_PASSWORD_CHANGE, 202));
        }
    }
    private async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        // accept the user_id or user_name from the req.body and update the password in the user table
        // perviously while student registration changes we have changed the password is changed to random generated UUID and stored and send in the payload,
        // now reset password use case is to change the password using user_id to some random generated ID and update the UUID also
        const randomGeneratedSixDigitID: any = this.nanoid();
        const cryptoEncryptedString = await this.authService.generateCryptEncryption(randomGeneratedSixDigitID);
        try {
            const { user_id } = req.body;
            req.body['UUID'] = randomGeneratedSixDigitID;
            req.body['encryptedString'] = cryptoEncryptedString;
            if (!user_id) throw badRequest(speeches.USER_USERID_REQUIRED);
            const result = await this.authService.studentResetPassword(req.body);
            if (!result) return res.status(404).send(dispatcher(res, null, 'error', speeches.USER_NOT_FOUND));
            else if (result.error) return res.status(404).send(dispatcher(res, result.error, 'error', result.error));
            else return res.status(202).send(dispatcher(res, result.data, 'accepted', speeches.USER_PASSWORD_CHANGE, 202));
        } catch (error) {
            next(error)
        }
        // const generatedUUID = this.nanoid();
        // req.body['generatedPassword'] = generatedUUID;
        // const result = await this.authService.restPassword(req.body, res);
        // if (!result) {
        //     return res.status(404).send(dispatcher(res, result.user_res, 'error', speeches.USER_NOT_FOUND));
        // } else if (result.match) {
        //     return res.status(404).send(dispatcher(res, result.match, 'error', speeches.USER_PASSWORD));
        // } else {
        //     return res.status(202).send(dispatcher(res, result, 'accepted', speeches.USER_PASSWORD_CHANGE, 202));
        // }
    }
    protected async getData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            let data: any;
            const { model, id } = req.params;
            const paramStatus: any = req.query;
            if (model) {
                this.model = model;
            };
            // pagination
            const { page, size, adult } = req.query;
            let condition = adult ? { UUID: null } : { UUID: { [Op.like]: `%%` } };
            const { limit, offset } = this.getPagination(page, size);
            const modelClass = await this.loadModel(model).catch(error => {
                next(error)
            });
            const where: any = {};
            let whereClauseStatusPart: any = {};
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPart = { "status": paramStatus }
            }
            if (id) {
                where[`${this.model}_id`] = req.params.id;
                data = await this.crudService.findOne(modelClass, {
                    attributes: [
                        "student_id",
                        "user_id",
                        "UUID",
                        "full_name",
                        "date_of_birth",
                        "qualification",
                        "badges",
                        "status"
                    ],
                    where: {
                        [Op.and]: [
                            whereClauseStatusPart,
                            where,
                        ],
                    },
                    include: {
                        model: team,
                        attributes: [
                            'team_id',
                            'team_name',
                            'mentor_id'
                        ],
                        include: {
                            model: mentor,
                            attributes: [
                                'organization_code',
                                'full_name',
                            ],
                            include: {
                                model: organization,
                                attributes: [
                                    "organization_name",
                                    "city",
                                    "district",
                                    "state",
                                    "country",
                                ],
                            }
                        }
                    }
                });
            } else {
                try {
                    const responseOfFindAndCountAll = await this.crudService.findAndCountAll(modelClass, {
                        where: {
                            [Op.and]: [
                                whereClauseStatusPart,
                                condition
                            ]
                        }, limit, offset
                    })
                    const result = this.getPagingData(responseOfFindAndCountAll, page, limit);
                    data = result;
                } catch (error: any) {
                    return res.status(500).send(dispatcher(res, data, 'error'))
                }

            }
            // if (!data) {
            //     return res.status(404).send(dispatcher(res,data, 'error'));
            // }
            if (!data || data instanceof Error) {
                if (data != null) {
                    throw notFound(data.message)
                } else {
                    throw notFound()
                }
                res.status(200).send(dispatcher(res, null, "error", speeches.DATA_NOT_FOUND));
                // if(data!=null){
                //     throw 
                (data.message)
                // }else{
                //     throw notFound()
                // }
            }

            return res.status(200).send(dispatcher(res, data, 'success'));
        } catch (error) {
            next(error);
        }
    }
    protected async updateData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { model, id } = req.params;
            if (model) {
                this.model = model;
            };
            const user_id = res.locals.user_id
            const where: any = {};
            let trimmedTeamName: any;
            let trimmedStudentName: any;
            trimmedStudentName = req.body.full_name.replace(/[\n\r\s\t]+/g, '').toLowerCase();
            const teamDetails = await this.authService.crudService.findOne(team, { where: { team_id: req.body.team_id } });
            if (!teamDetails) {
                return res.status(406).send(dispatcher(res, null, 'error', speeches.TEAM_NOT_FOUND, 406));
            } else {
                trimmedTeamName = teamDetails.dataValues.team_name.replace(/[\n\r\s\t\_]+/g, '').toLowerCase();
            }
            where[`${this.model}_id`] = req.params.id;
            const modelLoaded = await this.loadModel(model);
            const payload = this.autoFillTrackingColumns(req, res, modelLoaded);
            const student_data = await this.crudService.update(modelLoaded, payload, { where: where });
            const studentDetails = await this.crudService.findOne(modelLoaded, { where });
            if (!studentDetails) {
                throw badRequest()
            }
            if (studentDetails instanceof Error) {
                throw studentDetails;
            }
            const user_data = await this.crudService.update(user, {
                full_name: payload.full_name,
                username: trimmedTeamName + '_' + trimmedStudentName
            }, { where: { user_id: studentDetails.dataValues.user_id } });
            if (!student_data || !user_data) {
                throw badRequest()
            }
            if (student_data instanceof Error) {
                throw student_data;
            }
            if (user_data instanceof Error) {
                throw user_data;
            }
            return res.status(200).send(dispatcher(res, student_data, 'updated'));
        } catch (error) {
            next(error);
        }
    }
    private async addBadgeToStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            //todo: test this api : haven't manually tested this api yet 
            // console.log("came here");
            const student_user_id: any = req.params.student_user_id;
            const badges_ids: any = req.body.badge_ids;
            const badges_slugs: any = req.body.badge_slugs;
            let areSlugsBeingUsed  = true;
            if (!badges_slugs || !badges_slugs.length || badges_slugs.length <= 0) {
                areSlugsBeingUsed = false;
            }

            if (!areSlugsBeingUsed && (!badges_ids || !badges_ids.length || badges_ids.length <= 0)) {
                throw badRequest(speeches.BADGE_IDS_ARRAY_REQUIRED)
            }
            
            const serviceStudent = new StudentService()
            let studentBadgesObj: any = await serviceStudent.getStudentBadges(student_user_id);
            ///do not do empty or null check since badges obj can be null if no badges earned yet hence this is not an error condition 
            // console.log(studentBadgesObj)
            if (studentBadgesObj instanceof Error) {
                throw studentBadgesObj
            }
            if (!studentBadgesObj) {
                studentBadgesObj = {};
            }
            const success: any = []
            const errors: any = []
            
            let forLoopArr = badges_slugs;
            
            if(!areSlugsBeingUsed){
                forLoopArr  = badges_ids
            }

            for (var i = 0; i < forLoopArr.length; i++) {
                let badgeId = forLoopArr[i];
                let badgeFindWhereClause:any = {
                    slug:badgeId
                }
                if(!areSlugsBeingUsed){
                    badgeFindWhereClause = {
                        badge_id:badgeId
                    }
                }
                const badgeResultForId = await this.crudService.findOne(badge, { where: badgeFindWhereClause})
                if (!badgeResultForId) {
                    errors.push({ id: badgeId, err: badRequest(speeches.DATA_NOT_FOUND) })
                    continue;
                }
                if (badgeResultForId instanceof Error) {
                    errors.push({ id: badgeId, err: badgeResultForId })
                    continue;
                }

                const date = new Date();
                const studentHasBadgeObjForId = studentBadgesObj[badgeResultForId.dataValues.slug]
                if (!studentHasBadgeObjForId || !studentHasBadgeObjForId.completed_date) {
                    studentBadgesObj[badgeResultForId.dataValues.slug] = {
                        completed_date: ("" + date.getFullYear() + "-" + "" + (date.getMonth() + 1) + "-" + "" + date.getDay())
                    }
                }
            }
            // console.log(studentBadgesObj)
            const studentBadgesObjJson = JSON.stringify(studentBadgesObj)
            const result: any = await student.update({ badges: studentBadgesObjJson }, {
                where: {
                    user_id: student_user_id
                }
            })
            if (result instanceof Error) {
                throw result;
            }

            if (!result) {
                return res.status(404).send(dispatcher(res, null, 'error', speeches.USER_NOT_FOUND));
            }
            let dispatchStatus = "updated"
            let resStatus = 202
            let dispatchStatusMsg = speeches.USER_BADGES_LINKED
            if(errors&& errors.length>0){
                dispatchStatus = "error"
                dispatchStatusMsg="error"
                resStatus=400
            }

            return res.status(resStatus).send(dispatcher(res, { errs: errors, success: studentBadgesObj }, dispatchStatus, dispatchStatusMsg, resStatus));
        } catch (err) {
            next(err)
        }
    }


    private async getStudentBadges(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        //todo: implement this api ...!!
        try {
            // console.log("came here too");
            const student_user_id: any = req.params.student_user_id;
            const serviceStudent = new StudentService()
            let studentBadgesObj: any = await serviceStudent.getStudentBadges(student_user_id);
            ///do not do empty or null check since badges obj can be null if no badges earned yet hence this is not an error condition 
            if (studentBadgesObj instanceof Error) {
                throw studentBadgesObj
            }
            if (!studentBadgesObj) {
                studentBadgesObj = {};
            }
            const studentBadgesObjKeysArr = Object.keys(studentBadgesObj)
            const paramStatus: any = req.query.status;
            const where: any = {};
            let whereClauseStatusPart: any = {};
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPart = { "status": paramStatus }
            }
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPart = { "status": paramStatus }
            }
            const allBadgesResult = await badge.findAll({
                where: {
                    [Op.and]: [
                        whereClauseStatusPart,
                        where,
                    ]
                },
                raw: true,
            });

            if (!allBadgesResult) {
                throw notFound(speeches.DATA_NOT_FOUND);
            }
            if (allBadgesResult instanceof Error) {
                throw allBadgesResult;
            }
            // console.log(studentBadgesObj);
            for (var i = 0; i < allBadgesResult.length; i++) {
                const currBadge: any = allBadgesResult[i];
                // console.log(currBadge.slug)
                // console.log(studentBadgesObj)
                if (studentBadgesObj.hasOwnProperty("" + currBadge.slug)) {
                    currBadge["student_status"] = studentBadgesObj[("" + currBadge.slug)].completed_date
                } else {
                    currBadge["student_status"] = null;
                }
                allBadgesResult[i] = currBadge
            }

            return res.status(200).send(dispatcher(res, allBadgesResult, 'success'));
        } catch (err) {
            next(err)
        }
    }
}
        // private async updatePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        //     const result = await this.authService.updatePassword(req.body, res);
        //     if (!result) {
        //         return res.status(404).send(dispatcher(res,null, 'error', speeches.USER_NOT_FOUND));
        //     } else if (result.error) {
        //         return res.status(404).send(dispatcher(res,result.error, 'error', result.error));
        //     }
        //     else if (result.match) {
        //         return res.status(404).send(dispatcher(res,null, 'error', speeches.USER_PASSWORD));
        //     } else {
        //         return res.status(202).send(dispatcher(res,result.data, 'accepted', speeches.USER_PASSWORD_CHANGE, 202));
        //     }
        // }
