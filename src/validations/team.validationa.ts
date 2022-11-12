import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

// export const courseSchema = Joi.object().keys({
//     name: Joi.string().required().messages({
//         'string.empty': speeches.NAME_REQUIRED
//     }),
//     desc: Joi.string().required().messages({
//         'string.empty': speeches.DESCRIPTION_REQUIRED
//     }),
// });

const alphaNumPattern = /^[a-zA-Z0-9 ]*$/;
export const teamSchema = Joi.object().keys({
    mentor_id: Joi.string().trim().min(1).required().messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    team_name: Joi.string().trim().min(1).regex(alphaNumPattern).required().messages({
        'string.empty': speeches.NAME_REQUIRED
    })
});
export const teamUpdateSchema = Joi.object().keys({
    status: Joi.string().trim().min(1).valid(...Object.values(constents.common_status_flags.list)).required(),
    team_name: Joi.string().trim().min(1).regex(alphaNumPattern).required().messages({
        'string.empty': speeches.NAME_REQUIRED
    })
});