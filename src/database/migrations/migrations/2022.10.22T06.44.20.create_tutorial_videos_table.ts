import { Migration } from '../umzug';
import { badge } from '../../../models/badge.model';
import { tutorial_video } from '../../../models/tutorial_video.model';

// you can put some table-specific imports/code here
export const tableName = tutorial_video.modelTableName;
export const up: Migration = async ({ context: sequelize }) => {
	// await sequelize.query(`raise fail('up migration not implemented')`); //call direct sql 
	//or below implementation 
	await sequelize.getQueryInterface().createTable(tableName, tutorial_video.structrue);
};

export const down: Migration = async ({ context: sequelize }) => {
	// 	await sequelize.query(`raise fail('down migration not implemented')`); //call direct sql 
	//or below implementation 
	await sequelize.getQueryInterface().dropTable(tableName);
};