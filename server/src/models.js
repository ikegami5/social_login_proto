import { Sequelize, DataTypes, Model } from 'sequelize';
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres'
});

class User extends Model {}
User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    version: true
});

class SocialAccount extends Model {}
SocialAccount.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    provider: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    providerId: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    email: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
    }
}, {
    sequelize,
    tableName: 'social_accounts',
    timestamps: true,
    underscored: true,
    version: true
});

User.hasMany(SocialAccount, { foreignKey: 'user_id' });
SocialAccount.belongsTo(User, { foreignKey: 'user_id' });

class MetaSyncToken extends Model {}
MetaSyncToken.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }
}, {
    sequelize,
    tableName: 'meta_sync_tokens',
    timestamps: true,
    underscored: true,
    version: true
});

export { User, SocialAccount, MetaSyncToken, sequelize };
