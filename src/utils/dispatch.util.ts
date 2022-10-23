import express, { Request, Response, NextFunction, Router } from 'express'
import { http } from 'winston';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export default function dispatcher(res:Response,data: any, status:string="success", message:string = "OK", status_code:number=200): any{
        var resObj:any = {
            status: status_code,
            status_type: 'success',
            message: message,
            count: null,
            data: null
        }
        if(data){
            if(data.length === undefined){
                resObj.data = [data];
                resObj.count = resObj.data.length;
            }
            else if(typeof data === 'string'){
                resObj.data = data;
            }else if(data.length > 0){
                resObj.data = data;
                resObj.count = resObj.data.length;
            }
            else{
                resObj.data = data;
                resObj.count = resObj.data.length;
            }
        }

        switch(status){
            case "created":
                if(status_code==200) resObj.status = 201;
                break;
            case "error":
                if(status_code==200) resObj.status = 404;
                resObj.status_type = 'error';
                if (message== 'OK') resObj.message = speeches.DATA_NOT_FOUND;
                break;
            case "validation":
                if(status_code==200) resObj.status = 400;
                resObj.status_type = 'error';
                if (message== 'OK') resObj.message = speeches.DATA_NOT_FOUND;
                delete resObj.data;
                resObj.errors = data;
                break;
            default:
                break;
        }
        // console.log(resObj)
        // console.log(res.locals)
        if(res && res.locals && res.locals.translationService){
            if(res.locals.translationService.currentLocale != constents.translations_flags.default_locale){
                resObj = res.locals.translationService.translateEntireObj(resObj);
            }
        }
        
        // await logIt(flag, ((flag==constents.log_levels.list.INBOUND)? "Inbound request" : "Outbound responce"), req, res);

        return resObj;
    }
    