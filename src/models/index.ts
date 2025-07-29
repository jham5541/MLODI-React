import { Sequelize, DataTypes } from 'sequelize';
import * as config from '../config/database.json';

const env = process.env.NODE_ENV || 'development';
const dbConfig = (config as any)[env];

let sequelize: Sequelize;

if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable]!, dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

// Import models
import { EngagementModel } from './engagement';
import { FanScoreModel } from './fanScore';
import { UserModel } from './user';
import { ArtistModel } from './artist';

// Initialize models
const Engagement = EngagementModel(sequelize, DataTypes);
const FanScore = FanScoreModel(sequelize, DataTypes);
const User = UserModel(sequelize, DataTypes);
const Artist = ArtistModel(sequelize, DataTypes);

// Define associations
Engagement.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Engagement.belongsTo(Artist, { foreignKey: 'artistId', as: 'artist' });

FanScore.belongsTo(User, { foreignKey: 'userId', as: 'user' });
FanScore.belongsTo(Artist, { foreignKey: 'artistId', as: 'artist' });

User.hasMany(Engagement, { foreignKey: 'userId', as: 'engagements' });
User.hasMany(FanScore, { foreignKey: 'userId', as: 'fanScores' });

Artist.hasMany(Engagement, { foreignKey: 'artistId', as: 'engagements' });
Artist.hasMany(FanScore, { foreignKey: 'artistId', as: 'fanScores' });

const db = {
  sequelize,
  Sequelize,
  Engagement,
  FanScore,
  User,
  Artist
};

export default db;
export { Engagement, FanScore, User, Artist, sequelize };
