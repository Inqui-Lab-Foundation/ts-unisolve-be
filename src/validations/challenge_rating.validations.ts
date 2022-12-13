import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const challengeRatingSchema = Joi.object().keys({
    evaluator_id: Joi.number().required().messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    challenge_response_id: Joi.number().required().messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    level: Joi.string().valid(...Object.values(constents.challenge_rating_level_flags)).required().messages({
        'any.only': speeches.RATING_STATUS_INVALID,
        'string.empty': speeches.RATING_STATUS_REQUIRED
    }),
    param_1:  Joi.string().trim().min(1),
    param_2:  Joi.string().trim().min(1),
    param_3:  Joi.string().trim().min(1),
    param_4:  Joi.string().trim().min(1),
    param_5:  Joi.string().trim().min(1),
});

export const challengeRatingUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.common_status_flags.list)).required().messages({
        'any.only': speeches.COMMON_STATUS_INVALID,
        'string.empty': speeches.COMMON_STATUS_REQUIRED
    }),
    level: Joi.string().valid(...Object.values(constents.challenge_rating_level_flags)).required().messages({
        'any.only': speeches.RATING_STATUS_INVALID,
        'string.empty': speeches.RATING_STATUS_REQUIRED
    }),
    param_1: Joi.string().trim().min(1),
    param_2: Joi.string().trim().min(1),
    param_3: Joi.string().trim().min(1),
    param_4: Joi.string().trim().min(1),
    param_5: Joi.string().trim().min(1)
});