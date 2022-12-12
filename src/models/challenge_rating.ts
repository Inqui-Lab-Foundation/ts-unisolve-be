import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import db from '../utils/dbconnection.util';
import { constents } from '../configs/constents.config';
import { challenge_response } from './challenge_response.model';
import { evaluator } from './evaluator.model';


export class challenge_rating extends Model<InferAttributes<challenge_rating>, InferCreationAttributes<challenge_rating>> {
    declare challenge_evaluator_id: CreationOptional<number>;
    declare evaluator_id: ForeignKey<number>;
    declare challenge_response_id: string;
    declare level: Enumerator;
    declare param_1: string;
    declare param_2: string;
    declare param_3: string;
    declare param_4: string;
    declare param_5: string;
    declare overall: string;
    declare submitted_by: number;
    declare status: Enumerator;
    declare created_by: number;
    declare created_at: Date;
    declare updated_by: number;
    declare updated_at: Date;

    static modelTableName = "challenge_ratings";
    static structure: any = {
        challenge_rating_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        evaluator_id: {
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
        level: {
            type: DataTypes.ENUM(...Object.values(constents.challenge_rating_level_flags.list)),
            allowNull: false,
            defaultValue: constents.challenge_rating_level_flags.default
        },
        param_1: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '0'
        },
        param_2: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '0'
        },
        param_3: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '0'
        },
        param_4: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '0'
        },
        param_5: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '0'
        },
        overall: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '0'
        },
        submitted_by: {
            type: DataTypes.INTEGER,
            allowNull: true
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
challenge_rating.init(
    challenge_rating.structure,
    {
        sequelize: db,
        tableName: challenge_rating.modelTableName,
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
    }
);

challenge_response.belongsTo(challenge_rating, { foreignKey: 'challenge_response_id' });
challenge_rating.hasMany(challenge_response, { foreignKey: 'challenge_response_id' });
challenge_rating.belongsTo(evaluator, { foreignKey: 'evaluator_id' });
challenge_rating.hasMany(evaluator, { foreignKey: 'evaluator_id' });