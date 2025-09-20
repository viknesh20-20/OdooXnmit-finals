import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID } from '@/types/common';
import { RefreshToken } from '@domain/entities/RefreshToken';
import { IRefreshTokenRepository } from '@domain/repositories/IUserRepository';
import { EntityNotFoundError } from '@domain/exceptions/DomainException';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ILogger } from '@application/interfaces/IPasswordService';

@injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @inject('DatabaseConnection') private readonly databaseConnection: DatabaseConnection,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async findById(id: UUID): Promise<RefreshToken | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      const tokenRecord = await RefreshTokenModel.findByPk(id, {
        include: [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'status'],
          },
        ],
      });

      if (!tokenRecord) {
        return null;
      }

      return this.toDomainEntity(tokenRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding refresh token by ID', error as Error, { tokenId: id });
      throw error;
    }
  }

  public async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      const tokenRecord = await RefreshTokenModel.findOne({
        where: { token_hash: tokenHash },
        include: [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'status'],
          },
        ],
      });

      if (!tokenRecord) {
        return null;
      }

      return this.toDomainEntity(tokenRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding refresh token by hash', error as Error);
      throw error;
    }
  }

  public async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      const tokenRecord = await RefreshTokenModel.findOne({
        where: {
          token_hash: token, // Assuming token is already hashed
          revoked_at: null, // Only active tokens
        },
        include: [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'status'],
          },
        ],
      });

      if (!tokenRecord) {
        return null;
      }

      return this.toDomainEntity(tokenRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding refresh token by token', error as Error);
      throw error;
    }
  }

  public async findByUserId(userId: UUID): Promise<RefreshToken[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      const tokenRecords = await RefreshTokenModel.findAll({
        where: { 
          user_id: userId,
          revoked_at: null, // Only active tokens
        },
        include: [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'status'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      return tokenRecords.map((record: any) => this.toDomainEntity(record.toJSON()));
    } catch (error) {
      this.logger.error('Error finding refresh tokens by user ID', error as Error, { userId });
      throw error;
    }
  }

  public async findActiveByUserId(userId: UUID): Promise<RefreshToken[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      const tokenRecords = await RefreshTokenModel.findAll({
        where: { 
          user_id: userId,
          revoked_at: null,
          expires_at: {
            [Op.gt]: new Date(),
          },
        },
        include: [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'status'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      return tokenRecords.map((record: any) => this.toDomainEntity(record.toJSON()));
    } catch (error) {
      this.logger.error('Error finding active refresh tokens by user ID', error as Error, { userId });
      throw error;
    }
  }

  public async revokeAllUserTokens(userId: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      await RefreshTokenModel.update(
        { revoked_at: new Date() },
        {
          where: {
            user_id: userId,
            revoked_at: null,
          },
        }
      );

      this.logger.info('All user refresh tokens revoked', { userId });
    } catch (error) {
      this.logger.error('Error revoking all user refresh tokens', error as Error, { userId });
      throw error;
    }
  }

  public async cleanupExpiredTokens(): Promise<number> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      const deletedCount = await RefreshTokenModel.destroy({
        where: {
          expires_at: {
            [Op.lt]: new Date(),
          },
        },
      });

      this.logger.info('Expired refresh tokens cleaned up', { deletedCount });
      return deletedCount;
    } catch (error) {
      this.logger.error('Error cleaning up expired refresh tokens', error as Error);
      throw error;
    }
  }

  public async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      const tokenData = this.toPersistenceData(refreshToken);

      const [tokenRecord] = await RefreshTokenModel.upsert(tokenData, {
        returning: true,
      });

      // Fetch the complete record with associations
      const completeRecord = await RefreshTokenModel.findByPk(tokenRecord.id, {
        include: [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'status'],
          },
        ],
      });

      return this.toDomainEntity(completeRecord.toJSON());
    } catch (error) {
      this.logger.error('Error saving refresh token', error as Error, { tokenId: refreshToken.id });
      throw error;
    }
  }

  public async revokeToken(tokenId: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      await RefreshTokenModel.update(
        { revoked_at: new Date() },
        { where: { id: tokenId } }
      );

      this.logger.info('Revoked refresh token', { tokenId });
    } catch (error) {
      this.logger.error('Failed to revoke refresh token', error as Error);
      throw error;
    }
  }

  // Duplicate method removed - keeping the first implementation

  public async delete(id: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const RefreshTokenModel = sequelize.models.RefreshToken as any;

      const deletedCount = await RefreshTokenModel.destroy({
        where: { id },
      });

      if (deletedCount === 0) {
        throw new EntityNotFoundError('RefreshToken', id);
      }

      this.logger.info('Refresh token deleted successfully', { tokenId: id });
    } catch (error) {
      this.logger.error('Error deleting refresh token', error as Error, { tokenId: id });
      throw error;
    }
  }

  private toDomainEntity(data: any): RefreshToken {
    return RefreshToken.fromPersistence({
      id: data.id,
      userId: data.user_id,
      token: data.token_hash,
      expiresAt: data.expires_at,
      isRevoked: !!data.revoked_at,
      revokedAt: data.revoked_at,
      revokedBy: data.revoked_by,
      replacedByToken: data.replaced_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  private toPersistenceData(refreshToken: RefreshToken): any {
    const props = refreshToken.toPersistence();

    return {
      id: props.id,
      user_id: props.userId,
      token_hash: props.token,
      expires_at: props.expiresAt,
      revoked_at: props.revokedAt,
      revoked_by: props.revokedBy,
      replaced_by: props.replacedByToken,
      created_at: props.createdAt,
      updated_at: props.updatedAt,
    };
  }
}
