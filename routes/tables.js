const express = require('express');
const { create_table_section, add_table, get_sections, get_tables, change_status_of_table, delete_table } = require('../controllers/tables');
const router = express.Router();

  
router.route('/createTableSectionAPI').post(create_table_section);
router.route('/addTable').post(add_table);
router.route('/getSections').post(get_sections);
router.route('/getTables').post(get_tables);
router.route('/workingTableStatusChangeAPI').post(change_status_of_table);
router.route('/deleteTableAPI').post(delete_table);
module.exports = {
    tableRoutes:router
}