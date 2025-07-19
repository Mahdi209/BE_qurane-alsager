const Joi = require('joi');

const signupSchema = Joi.object({
    username: Joi.string().required(),
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('supervisor', 'admin', 'user').default('user'),
    permissions: Joi.string(),
    profile: Joi.any()
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

module.exports = {
    signupSchema,
    loginSchema
};
