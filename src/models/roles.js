const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        permissions: {
            category: {
                create: {
                    type: Boolean,
                    default: false
                },
                read: {
                    type: Boolean,
                    default: false
                },
                update: {
                    type: Boolean,
                    default: false
                },
                delete: {
                    type: Boolean,
                    default: false
                }
            },
            ageGroup: {
                create: {
                    type: Boolean,
                    default: false
                },
                read: {
                    type: Boolean,
                    default: false
                },
                update: {
                    type: Boolean,
                    default: false
                },
                delete: {
                    type: Boolean,
                    default: false
                }
            },
            question: {
                create: {
                    type: Boolean,
                    default: false
                },
                read: {
                    type: Boolean,
                    default: false
                },
                update: {
                    type: Boolean,
                    default: false
                },
                delete: {
                    type: Boolean,
                    default: false
                }
            }
        },
    },
    { timestamps: true,        versionKey: false,
    }
);

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;