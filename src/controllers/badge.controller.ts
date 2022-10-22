
import { badgeSchema, badgeUpdateSchema } from "../validations/badges.validations";
import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";

export default class BadgeController extends BaseController {

    model = "badge";

    protected initializePath(): void {
        this.path = '/badges';
    }
    protected initializeValidations(): void {
        this.validations =  new ValidationsHolder(badgeSchema,badgeUpdateSchema);
    }
    protected initializeRoutes(): void {
        //example route to add 
        //this.router.get(`${this.path}/`, this.getData);
        super.initializeRoutes();
    }
}