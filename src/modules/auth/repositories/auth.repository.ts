import { prisma } from "../../../config/database";
import { User, Role } from "@prisma/client";

export class AuthRepository {
  async findByEmail(email: string): Promise<(User & { role: Role & { rolePermissions: any[] } }) | null> {
    return prisma.user.findFirst({
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
    }) as any;
  }

  async findById(id: string): Promise<(User & { role: Role & { rolePermissions: any[] } }) | null> {
    return prisma.user.findFirst({
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
    }) as any;
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  async createUser(data: any): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async updateUser(id: string, data: any): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}
