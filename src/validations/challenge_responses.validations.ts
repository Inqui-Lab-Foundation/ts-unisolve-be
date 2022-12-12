import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const challengeResponsesUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.challenges_flags.list)).required().messages({
        'any.only': speeches.COMMON_STATUS_INVALID,
        'string.empty': speeches.COMMON_STATUS_REQUIRED
    })
});
export const initiateIdeaSchema = Joi.object().keys({
    sdg: Joi.string().required().messages({
        'any.only': speeches.COMMON_STATUS_INVALID,
    })
});
export const challengeResponsesSchema = Joi.object().keys({
    responses: Joi.array().required().messages({
        'any': speeches.SELCTED_OPTION_REQUIRED
    }),
    status: Joi.string().valid(...Object.values(constents.challenges_flags.list)).required().messages({
        'any.only': speeches.COMMON_STATUS_INVALID,
        'string.empty': speeches.COMMON_STATUS_REQUIRED
    }),
    sdg: Joi.any(),
    others: Joi.any(),
});