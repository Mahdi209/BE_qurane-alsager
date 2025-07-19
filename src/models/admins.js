const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
        type: String,
        required: false,},
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    role: {
        type: String,
        enum: ['supervisor', 'admin', 'user'],
        default: 'user',
    },
    refreshToken: { type: String },
    tokenVersion: { type: Number, default: 0 },
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
    {
        timestamps: true,
        VersionKey: false,
    });

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
