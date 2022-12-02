import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import db from '../utils/dbconnection.util';
import { constents } from '../configs/constents.config';
import { challenge_response } from './challenge_response.model';
import { evaluater } from './evaluater.model';


export class challenge_evaluater_map extends Model<InferAttributes<challenge_evaluater_map>, InferCreationAttributes<challenge_evaluater_map>> {
    declare challenge_evaluater_id: CreationOptional<number>;
    declare evaluater_id: ForeignKey<number>;
    declare challenge_response_id: string;
    declare status: Enumerator;
    declare created_by: number;
    declare created_at: Date;
    declare updated_by: number;
    declare updated_at: Date;

    static modelTableName = "challenge_evaluater_map";
    static structure: any = {
        challenge_evaluater_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        evaluater_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        challenge_response_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM(...Object.values(constents.common_status_flags.list)),
            defaultValue: constents.common_status_flags.default
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
            onUpdate: new Date().toLocaleString()
        }
    };
}
challenge_evaluater_map.init(
    challenge_evaluater_map.structure,
    {
        sequelize: db,
        tableName: challenge_evaluater_map.modelTableName,
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
    }
);

challenge_response.belongsTo(challenge_evaluater_map, { foreignKey: 'challenge_response_id' });
challenge_evaluater_map.hasMany(challenge_response, { foreignKey: 'challenge_response_id' });
challenge_evaluater_map.belongsTo(evaluater, { foreignKey: 'evaluater_id' });
challenge_evaluater_map.hasMany(evaluater, { foreignKey: 'evaluater_id' });