import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID, PaginatedResult, Pagination } from '@/types/common';
import { User } from '@domain/entities/User';
import { IUserRepository, UserFilters } from '@domain/repositories/IUserRepository';
import { Email, Username } from '@domain/value-objects/Email';
import { EntityNotFoundError } from '@domain/exceptions/DomainException';
import { DatabaseConnection, UserModel } from '@infrastructure/database/config/DatabaseConfig';
import { UserMapper } from '@application/mappers/UserMapper';
import { ILogger } from '@application/interfaces/IPasswordService';

@injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @inject('DatabaseConnection') private readonly databaseConnection: DatabaseConnection,
    @inject('UserMapper') private readonly mapper: UserMapper,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async findById(id: UUID): Promise<User | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const userRecord = await UserModel.findByPk(id, {
        include: [
          {
            model: sequelize.models.Role,
            as: 'role',
            attributes: ['id', 'name', 'description', 'permissions'],
          },
        ],
      });

      if (!userRecord) {
        return null;
      }

      return this.mapper.toDomainEntity(userRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding user by ID', error as Error, { userId: id });
      throw error;
    }
  }

  public async findByEmail(email: Email): Promise<User | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const userRecord = await UserModel.findOne({
        where: { email: email.value },
        include: [
          {
            model: sequelize.models.Role,
            as: 'role',
            attributes: ['id', 'name', 'description', 'permissions'],
          },
        ],
      });

      if (!userRecord) {
        return null;
      }

      return this.mapper.toDomainEntity(userRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding user by email', error as Error, { email: email.value });
      throw error;
    }
  }

  public async findByUsername(username: Username): Promise<User | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const userRecord = await UserModel.findOne({
        where: { username: username.value },
        include: [
          {
            model: sequelize.models.Role,
            as: 'role',
            attributes: ['id', 'name', 'description', 'permissions'],
          },
        ],
      });

      if (!userRecord) {
        return null;
      }

      return this.mapper.toDomainEntity(userRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding user by username', error as Error, { username: username.value });
      throw error;
    }
  }

  public async findByEmailVerificationToken(token: string): Promise<User | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const userRecord = await UserModel.findOne({
        where: {
          email_verification_token: token,
          email_verification_expires: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!userRecord) {
        return null;
      }

      return this.mapper.toDomainEntity(userRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding user by email verification token', error as Error);
      throw error;
    }
  }

  public async findByPasswordResetToken(token: string): Promise<User | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const userRecord = await UserModel.findOne({
        where: {
          password_reset_token: token,
          password_reset_expires: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!userRecord) {
        return null;
      }

      return this.mapper.toDomainEntity(userRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding user by password reset token', error as Error);
      throw error;
    }
  }

  public async findWithFilters(
    filters: UserFilters,
    pagination?: Pagination
  ): Promise<PaginatedResult<User>> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const whereClause: any = {};

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.roleId) {
        whereClause.role_id = filters.roleId;
      }

      if (filters.emailVerified !== undefined) {
        whereClause.email_verified = filters.emailVerified;
      }

      if (filters.search) {
        whereClause[Op.or] = [
          { username: { [Op.iLike]: `%${filters.search}%` } },
          { email: { [Op.iLike]: `%${filters.search}%` } },
          { first_name: { [Op.iLike]: `%${filters.search}%` } },
          { last_name: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      const limit = pagination?.limit ?? 20;
      const offset = pagination?.offset ?? 0;

      const { count, rows } = await UserModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.Role,
            as: 'role',
            attributes: ['id', 'name', 'description', 'permissions'],
          },
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      const users = rows.map((record: any) => this.mapper.toDomainEntity(record.toJSON()));

      return {
        data: users,
        total: count,
        page: pagination?.page ?? 1,
        limit,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      this.logger.error('Error finding users with filters', error as Error, { filters });
      throw error;
    }
  }

  public async findAll(pagination?: Pagination): Promise<PaginatedResult<User>> {
    return this.findWithFilters({}, pagination);
  }

  public async existsByEmail(email: Email): Promise<boolean> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const count = await UserModel.count({
        where: { email: email.value },
      });

      return count > 0;
    } catch (error) {
      this.logger.error('Error checking if user exists by email', error as Error, { email: email.value });
      throw error;
    }
  }

  public async existsByUsername(username: Username): Promise<boolean> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const count = await UserModel.count({
        where: { username: username.value },
      });

      return count > 0;
    } catch (error) {
      this.logger.error('Error checking if user exists by username', error as Error, { username: username.value });
      throw error;
    }
  }

  public async findByRoleId(roleId: UUID, pagination?: Pagination): Promise<PaginatedResult<User>> {
    return this.findWithFilters({ roleId }, pagination);
  }

  public async save(user: User): Promise<User> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const userData = this.mapper.toPersistenceData(user);

      const [userRecord] = await UserModel.upsert(userData, {
        returning: true,
      });

      return this.mapper.toDomainEntity(userRecord.toJSON());
    } catch (error) {
      this.logger.error('Error saving user', error as Error, { userId: user.id });
      throw error;
    }
  }

  public async delete(id: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const UserModel = sequelize.models.User as any;

      const deletedCount = await UserModel.destroy({
        where: { id },
      });

      if (deletedCount === 0) {
        throw new EntityNotFoundError('User', id);
      }

      this.logger.info('User deleted successfully', { userId: id });
    } catch (error) {
      this.logger.error('Error deleting user', error as Error, { userId: id });
      throw error;
    }
  }
}
