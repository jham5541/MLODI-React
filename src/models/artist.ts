import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface ArtistAttributes {
  id: string;
  name: string;
  bio?: string;
  profilePicture?: string;
  coverImage?: string;
  genre?: string;
  country?: string;
  city?: string;
  followerCount: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ArtistCreationAttributes extends Optional<ArtistAttributes, 'id' | 'bio' | 'profilePicture' | 'coverImage' | 'genre' | 'country' | 'city' | 'followerCount' | 'isVerified' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Artist extends Model<ArtistAttributes, ArtistCreationAttributes> implements ArtistAttributes {
  public id!: string;
  public name!: string;
  public bio?: string;
  public profilePicture?: string;
  public coverImage?: string;
  public genre?: string;
  public country?: string;
  public city?: string;
  public followerCount!: number;
  public isVerified!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const ArtistModel = (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  Artist.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: dataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 200],
        },
      },
      bio: {
        type: dataTypes.TEXT,
        allowNull: true,
      },
      profilePicture: {
        type: dataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      coverImage: {
        type: dataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      genre: {
        type: dataTypes.STRING,
        allowNull: true,
        validate: {
          len: [1, 100],
        },
      },
      country: {
        type: dataTypes.STRING,
        allowNull: true,
        validate: {
          len: [2, 100],
        },
      },
      city: {
        type: dataTypes.STRING,
        allowNull: true,
        validate: {
          len: [1, 100],
        },
      },
      followerCount: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      isVerified: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isActive: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Artist',
      tableName: 'artists',
      timestamps: true,
      indexes: [
        {
          fields: ['name'],
        },
        {
          fields: ['genre'],
        },
        {
          fields: ['country'],
        },
        {
          fields: ['followerCount'],
        },
        {
          fields: ['isVerified'],
        },
        {
          fields: ['isActive'],
        },
      ],
    }
  );

  return Artist;
};
