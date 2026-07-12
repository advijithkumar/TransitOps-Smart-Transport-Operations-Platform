"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const database_1 = require("../../../config/database");
class AuthRepository {
    async findByEmail(email) {
        return database_1.prisma.user.findFirst({
            where: {
                email,
                deletedAt: null,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async findById(id) {
        return database_1.prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async findRoleByName(name) {
        return database_1.prisma.role.findUnique({
            where: { name },
        });
    }
    async createUser(data) {
        return database_1.prisma.user.create({
            data,
        });
    }
    async updateUser(id, data) {
        return database_1.prisma.user.update({
            where: { id },
            data,
        });
    }
}
exports.AuthRepository = AuthRepository;
