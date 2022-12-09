import { Request, Response, NextFunction } from 'express';

import { speeches } from '../configs/speeches.config';
import dispatcher from '../utils/dispatch.util';
import authService from '../services/auth.service';
import BaseController from './base.controller';
import ValidationsHolder from '../validations/validationHolder';

export default class AdminController extends BaseController {
    model = "admin";
    authService: authService = new authService;
    private password = process.env.GLOBAL_PASSWORD;

    protected initializePath(): void {
        this.path = '/admins';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(null, null);
    }
    protected initializeRoutes(): void {
        //example route to add
        //this.router.get(`${this.path}/`, this.getData);
        this.router.post(`${this.path}/register`, this.register.bind(this));
        this.router.post(`${this.path}/login`, this.login.bind(this));
        this.router.get(`${this.path}/logout`, this.logout.bind(this));
        this.router.put(`${this.path}/changePassword`, this.changePassword.bind(this));
        // this.router.put(`${this.path}/updatePassword`, this.updatePassword.bind(this));
        super.initializeRoutes();
    }
    private async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (!req.body.username || req.body.username === "") req.body.username = req.body.full_name.replace(/\s/g, '');
        if (!req.body.password || req.body.password === "") req.body.password = this.password;
        if (!req.body.role || req.body.role !== 'ADMIN') {
            return res.status(406).send(dispatcher(res,null, 'error', speeches.USER_ROLE_REQUIRED, 406));
        }
        const result = await this.authService.register(req.body);
        if (result.user_res) return res.status(406).send(dispatcher(res, result.user_res.dataValues, 'error', speeches.EVALUATOR_EXISTS, 406));
        return res.status(201).send(dispatcher(res, result.profile.dataValues, 'success', speeches.USER_REGISTERED_SUCCESSFULLY, 201));
    }

    private async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        let adminDetails: any;
        req.body['role'] = 'ADMIN'
        const result = await this.authService.login(req.body);
        if (!result) {
            return res.status(404).send(dispatcher(res,result, 'error', speeches.USER_NOT_FOUND));
        } else if (result.error) {
            return res.status(401).send(dispatcher(res,result.error, 'error', speeches.USER_RISTRICTED, 401));
        } else {
            adminDetails = await this.authService.getServiceDetails('admin', { user_id: result.data.user_id });
            if (!adminDetails) {
                result.data['admin_id'] = null;
            } else {
                result.data['admin_id'] = adminDetails.dataValues.admin_id;
            }
            return res.status(200).send(dispatcher(res,result.data, 'success', speeches.USER_LOGIN_SUCCESS));
        }
    }

    private async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        const result = await this.authService.logout(req.body, res);
        if (result.error) {
            next(result.error);
        } else {
            return res.status(200).send(dispatcher(res,speeches.LOGOUT_SUCCESS, 'success'));
        }
    }

    private async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        const result = await this.authService.changePassword(req.body, res);
        if (!result) {
            return res.status(404).send(dispatcher(res,null, 'error', speeches.USER_NOT_FOUND));
        } else if (result.error) {
            return res.status(404).send(dispatcher(res,result.error, 'error', result.error));
        }
        else if (result.match) {
            return res.status(404).send(dispatcher(res,null, 'error', speeches.USER_PASSWORD));
        } else {
            return res.status(202).send(dispatcher(res,result.data, 'accepted', speeches.USER_PASSWORD_CHANGE, 202));
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
};