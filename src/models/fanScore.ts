import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface FanScoreAttributes {
  id: string;
  userId: string;
  artistId: string;
  totalScore: number;
  streamingPoints: number;
  purchasePoints: number;
  socialPoints: number;
  videoPoints: number;
  eventPoints: number;
  consecutiveDays: number;
  fanSince: Date;
  lastUpdated: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FanScoreCreationAttributes extends Optional<FanScoreAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class FanScore extends Model<FanScoreAttributes, FanScoreCreationAttributes> implements FanScoreAttributes {
  public id!: string;
  public userId!: string;
  public artistId!: string;
  public totalScore!: number;
  public streamingPoints!: number;
  public purchasePoints!: number;
  public socialPoints!: number;
  public videoPoints!: number;
  public eventPoints!: number;
  public consecutiveDays!: number;
  public fanSince!: Date;
  public lastUpdated!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const FanScoreModel = (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  FanScore.init(
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
      totalScore: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      streamingPoints: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      purchasePoints: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      socialPoints: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      videoPoints: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      eventPoints: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      consecutiveDays: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      fanSince: {
        type: dataTypes.DATE,
        allowNull: false,
        defaultValue: dataTypes.NOW,
      },
      lastUpdated: {
        type: dataTypes.DATE,
        allowNull: false,
        defaultValue: dataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'FanScore',
      tableName: 'fan_scores',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'artistId'],
        },
        {
          fields: ['artistId', 'totalScore'],
        },
        {
          fields: ['totalScore'],
        },
        {
          fields: ['lastUpdated'],
        },
      ],
    }
  );

  return FanScore;
};
