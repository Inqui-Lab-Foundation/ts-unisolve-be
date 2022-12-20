import { badRequest, internal } from "boom";
import * as csv from "fast-csv";
import { NextFunction, Request, Response } from "express";
import fs from 'fs';
import { any, date } from "joi";
import path from 'path';
import { speeches } from "../configs/speeches.config";
import dispatcher from "../utils/dispatch.util";
import ValidationsHolder from "../validations/validationHolder";
import { videoSchema, videoUpdateSchema } from "../validations/video.validations";
import BaseController from "./base.controller";
import { organizationCheckSchema, organizationRawSchema, organizationSchema, organizationUpdateSchema } from "../validations/organization.validations";
import authService from "../services/auth.service";
import validationMiddleware from "../middlewares/validation.middleware";
import { Op } from "sequelize";

export default class OrganizationController extends BaseController {

    model = "organization";
    authService: authService = new authService;

    protected initializePath(): void {
        this.path = '/organizations';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(organizationSchema, organizationUpdateSchema);
    }
    protected initializeRoutes(): void {
        this.router.post(`${this.path}/bulkUpload`, this.bulkUpload.bind(this));
        this.router.get(`${this.path}/districts`, this.getGroupByDistrict.bind(this));
        this.router.post(`${this.path}/checkOrg`, validationMiddleware(organizationCheckSchema), this.checkOrgDetails.bind(this));
        this.router.post(`${this.path}/createOrg`, validationMiddleware(organizationRawSchema), this.createOrg.bind(this));
        super.initializeRoutes();
    };
    private async checkOrgDetails(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        const org = await this.authService.checkOrgDetails(req.body.organization_code);
        if (!org) {
            res.status(400).send(dispatcher(res,null, 'error', speeches.BAD_REQUEST))
        } else {
            res.status(200).send(dispatcher(res,org, 'success', speeches.FETCH_FILE));
        }
    }
    private async getGroupByDistrict(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            let response: any = [];
            const { model } = req.params;
            if (model) {
                this.model = model;
            };
            const modelClass = await this.loadModel(model).catch(error => {
                next(error)
            });
            let objWhereClauseStatusPart = this.getWhereClauseStatsPart(req);
            const result = await this.crudService.findAll(modelClass, {
                attributes: [
                    'district'
                ],
                where: {
                    [Op.and]: [
                        objWhereClauseStatusPart.whereClauseStatusPart
                    ]
                },
                group: ['district']
            });
            result.forEach((obj: any) => {
                response.push(obj.dataValues.district)
            });
            response.push('All Districts');
            return res.status(200).send(dispatcher(res, response, 'success'));
        } catch (error) {
            console.log(error)
            next(error);
        }
    }
    private async createOrg(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        // console.log(req.body);
        return this.createData(req,res,next);
    }
}
