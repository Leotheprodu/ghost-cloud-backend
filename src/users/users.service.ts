import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma.service';
import { passwordEncrypt } from './utils/handlePassword';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers() {
    return await this.prisma.users.findMany({
      omit: {
        password: true,
      },
      include: {
        roles: {
          select: {
            id: true,
          },
        },
        services: {
          select: {
            id: true,
            serviceId: true,
            status: true,
            paymentDate: true,
          },
        },
      },
    });
  }
  async createUser(user: CreateUserDto) {
    const password = await passwordEncrypt(user.password);
    return this.prisma.users.create({
      data: { ...user, password },
      omit: {
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUser(id: number) {
    return await this.prisma.users.findUnique({
      where: { id },
      include: { roles: true },
    });
  }

  deleteUser(id: number) {
    return this.prisma.users.delete({ where: { id } });
  }
  updateUser(id: number, user: CreateUserDto) {
    return this.prisma.users.update({ where: { id }, data: user });
  }
  addRole(userId: number, roleId: number) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: roleId },
        },
      },
    });
  }
  removeRole(userId: number, roleId: number) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: roleId },
        },
      },
    });
  }
}
