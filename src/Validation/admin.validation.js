const Joi = require('joi');

const permissionsObject = Joi.object({
    create: Joi.boolean(),
    read: Joi.boolean(),
    update: Joi.boolean(),
    delete: Joi.boolean()
});

const signupSchema = Joi.object({
    username: Joi.string().required(),
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('supervisor', 'admin', 'user').default('user'),
    profile: Joi.any(),
    permissions: Joi.object({
        category: permissionsObject,
        ageGroup: permissionsObject,
        question: permissionsObject
    }).optional()
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

module.exports = {
    signupSchema,
    loginSchema
};