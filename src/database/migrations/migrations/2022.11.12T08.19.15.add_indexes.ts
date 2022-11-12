import { Migration } from '../umzug';
import { DataTypes } from 'sequelize';
import { constents } from '../../../configs/constents.config';

// you can put some table-specific imports/code here
export const tableName = "name_of_your_table";
export const up: Migration = async ({ context: sequelize }) => {
	// await sequelize.query(`raise fail('up migration not implemented')`); //call direct sql 
	//or below implementation 
	const transaction = await sequelize.getQueryInterface().sequelize.transaction();
  try{
    //users table 
    await sequelize.getQueryInterface().addIndex("users", ['username'], { 
		name: 'IDX_USR_UN',
		unique:true,
		transaction });

	//teams table
	await sequelize.getQueryInterface().addIndex("teams", ['mentor_id',"name"], { 
		name: 'UNQ_TEAM_NAME',
		unique:true,
	  	transaction });
    
	//course_topics table
	await sequelize.getQueryInterface().addIndex("course_topics", ['topic_type'], { name: 'IDX_CTOP_CTOPTYPE',transaction });
	await sequelize.getQueryInterface().addIndex("course_topics", ['topic_type_id'], { name: 'IDX_CTOP_CTOPTYPEID',transaction });

    await transaction.commit();
  }catch(err){
      await transaction.rollback();
      throw err;
  }
	
};

export const down: Migration = async ({ context: sequelize }) => {
	// 	await sequelize.query(`raise fail('down migration not implemented')`); //call direct sql 
	//or below implementation 
	// await sequelize.getQueryInterface().dropTable(tableName);
	try {
		// await sequelize.transaction(async (transaction) => {
		//   const options = { transaction };
		//   await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", options);
		//   await sequelize.query(`DROP TABLE ${tableName}`, options);
		//   await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", options);
		// });

		throw Error("not yet implemented")
	  } catch (error) {
		console.log(error);
	  }
};