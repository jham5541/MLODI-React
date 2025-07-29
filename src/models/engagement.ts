import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { EngagementType } from '../types/fanScoring';

interface EngagementAttributes {
  id: string;
  userId: string;
  artistId: string;
  engagementType: EngagementType;
  points: number;
  timestamp: Date;
  metadata: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EngagementCreationAttributes extends Optional<EngagementAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Engagement extends Model<EngagementAttributes, EngagementCreationAttributes> implements EngagementAttributes {
  public id!: string;
  public userId!: string;
  public artistId!: string;
  public engagementType!: EngagementType;
  public points!: number;
  public timestamp!: Date;
  public metadata!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const EngagementModel = (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  Engagement.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: dataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      artistId: {
        type: dataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      engagementType: {
        type: dataTypes.ENUM(...Object.values(EngagementType)),
        allowNull: false,
      },
      points: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      timestamp: {
        type: dataTypes.DATE,
        allowNull: false,
        defaultValue: dataTypes.NOW,
      },
      metadata: {
        type: dataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: 'Engagement',
      tableName: 'engagements',
      timestamps: true,
      indexes: [
        {
          fields: ['userId', 'artistId'],
        },
        {
          fields: ['artistId', 'timestamp'],
        },
        {
          fields: ['userId', 'timestamp'],
        },
        {
          fields: ['engagementType'],
        },
      ],
    }
  );

  return Engagement;
};
