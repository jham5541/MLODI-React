import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface UserAttributes {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'profilePicture' | 'firstName' | 'lastName' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public email!: string;
  public profilePicture?: string;
  public firstName?: string;
  public lastName?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const UserModel = (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  User.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: dataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 50],
        },
      },
      email: {
        type: dataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      profilePicture: {
        type: dataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      firstName: {
        type: dataTypes.STRING,
        allowNull: true,
        validate: {
          len: [1, 100],
        },
      },
      lastName: {
        type: dataTypes.STRING,
        allowNull: true,
        validate: {
          len: [1, 100],
        },
      },
      isActive: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      indexes: [
        {
          fields: ['username'],
        },
        {
          fields: ['email'],
        },
        {
          fields: ['isActive'],
        },
      ],
    }
  );

  return User;
};
