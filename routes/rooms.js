const express = require('express');
const { create_room_section, add_room, get_room_sections, get_rooms, delete_room, change_status_of_room } = require('../controllers/rooms');
const router = express.Router();

  
router.route('/createRoomSectionAPI').post(create_room_section);
router.route('/addRoom').post(add_room);
router.route('/getRoomSections').post(get_room_sections);
router.route('/getRooms').post(get_rooms);
router.route('/workingRoomStatusChangeAPI').post(change_status_of_room);
router.route('/deleteRoomAPI').post(delete_room);
module.exports = {
    roomRoutes:router
}