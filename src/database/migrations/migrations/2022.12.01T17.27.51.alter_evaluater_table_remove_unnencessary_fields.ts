import { Migration } from '../umzug';
import { DataTypes } from 'sequelize';
import { constents } from '../../../configs/constents.config';

export const tableName = "evaluaters";
export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().removeColumn(tableName, "organization_name");
	await sequelize.getQueryInterface().removeColumn(tableName, "state");
	await sequelize.getQueryInterface().removeColumn(tableName, "country");
	await sequelize.getQueryInterface().addColumn(tableName, "mobile", {
		type: DataTypes.STRING,
		unique: true
	});
};

export const down: Migration = async ({ context: sequelize }) => {
	try {
		await sequelize.getQueryInterface().addColumn(tableName, "organization_name", {
			type: DataTypes.STRING,
			allowNull: true,
		});
		await sequelize.getQueryInterface().addColumn(tableName, "state", {
			type: DataTypes.STRING
		});
		await sequelize.getQueryInterface().addColumn(tableName, "country", {
			type: DataTypes.STRING
		});
		await sequelize.getQueryInterface().removeColumn(tableName, "mobile");
	} catch (error) {
		throw error
	}
};