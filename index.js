require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const server = require('http').createServer(app);



app.use(cors());
app.options('*',cors());

const io = require('socket.io')(server,{
  cors:{
    origin: '*', 
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

const socketRooms = {};
const kotRooms = {};
io.on('connection',(socket)=>{
  console.log('conne');  
  socket.on('newUser',(shopID)=>{
    if (shopID) {
      if (!socketRooms[shopID]) {
        socketRooms[shopID] = socket?.id; 
        socket.join(shopID); 
      }
    }
  })
  socket.on('kot_new_user',(shop_id_kot)=>{
    if (shop_id_kot){
      if(!kotRooms[shop_id_kot]){
        kotRooms[shop_id_kot] = socket?.id
        socket.join(`kot_${shop_id_kot}`);
      }
      } 
  })

  socket.on('disconnect',()=>{
   console.log('diss');
    for (const room in socketRooms) {
      if (socketRooms[room] === socket.id) {
        delete socketRooms[room];
        socket.leave(room); 
        break; 
      }
    }
    for (const room in kotRooms) {
      if (kotRooms[room] === socket.id) {
        delete kotRooms[room]; 
        socket.leave(room); 
        break; 
      }
    }
  })
})

const { checkTokenID, checkKotTokenID, checkWaiterTokenID } = require('./middlewares/auth');

const  {userRouter, userRouter_other_info, userRouter_other_image}  = require('./routes/user');
const { tableRoutes } = require('./routes/tables');
const { foodRoutes, foodRoutes2 } = require('./routes/food');
const { orderRoutes, customerOrderRoute, orderRoutewithIO } = require('./routes/inventorie');
const { expenseRoutes } = require('./routes/expense');
const { shopListing } = require('./routes/shoplisting');
const { menuRouter } = require('./routes/menu');
const { commentRoutes } = require('./routes/comment');
const { notificationRouter } = require('./routes/notification');
const { orderInventorieRoutes } = require('./routes/orderInventorie');
const { kotRoutes, kot_unAut_Router, kot_auth_Router } = require('./routes/kotuser');
const { orderListRoute } = require('./routes/orderList');
const { getToken } = require('./constants/auth');
const { KOT_send_to_kitchen, fastOrder_KOT_send_to_kitchen } = require('./controllers/inventorie');

//----------- Rooms
const { roomRoutes } = require('./routes/rooms');
const { orderRoomRoutes, customerRoomOrderRoute } = require('./routes/roomInventorie');
const { room_KOT_send_to_kitchen } = require('./controllers/roomInventorie');
const { roomorderInventorieRoutes } = require('./routes/roomorderinventorie');
const { notificationroomRouter } = require('./routes/notificationroom');
const { staffRouter } = require('./routes/staff');
const { WaiterRoutes, shopWaiterRoutes } = require('./routes/waiter');
const { WaitertableRoutes, WaitertableRoutes2 } = require('./routes/waitertable');
const { dashBoardRoutes } = require('./routes/dashboard');
const { homeRoutes } = require('./routes/home');
const { reminderRoute } = require('./routes/reminder');
const { adminRoutes } = require('./routes/admin');

const PORT = process.env.PORT;

app.use(cors());
app.use(express.json({extended:false}));
app.use(express.urlencoded({extended: false}));
app.use('/uploads', express.static('uploads'));
// Connection
mongoose.connect(process.env.DB_NAME).then(()=>console.log('mongodb Connected...')).catch((err)=>console.log('mongodb Failed Connection...',err))


app.use('/api/auth',userRouter);
app.use('/api/menu',menuRouter)
app.use('/api/comment',commentRoutes)
app.use('/api/shoplisting',shopListing);
app.use('/api/other',checkTokenID,userRouter_other_info);
app.use('/api/otherimage',userRouter_other_image);
app.use('/api/table',checkTokenID,tableRoutes);
app.use('/api/food',foodRoutes);
app.use('/api/food',checkTokenID,foodRoutes2);

app.use('/api/customer/inventorie',customerOrderRoute);
app.use('/api/user/notification',notificationRouter);
app.use('/api/expenses',checkTokenID,expenseRoutes);
app.use('/api/kot',checkTokenID,kotRoutes);
app.use('/api/unA/kot',kot_unAut_Router);
app.use('/api/orderList',checkTokenID,orderListRoute);
app.use('/api/staff',checkTokenID,staffRouter);
app.use('/api/dashboard',checkTokenID,dashBoardRoutes);
app.use('/api/barcode',checkTokenID,userRouter_other_info);
app.use('/api/home',homeRoutes);
app.use('/api/reminder',checkTokenID,reminderRoute);
app.use('/api/admin',adminRoutes);
// notify send kr ke leye.
const newMiddleWear = (req,res,next)=>{
  req.io = io;
  next();
}
app.use('/api/inventorie',checkTokenID,newMiddleWear,orderRoutes);
app.use('/api/fastinventorie',checkTokenID,newMiddleWear,orderRoutewithIO);

app.use('/api/isauth/kot',checkKotTokenID,newMiddleWear,kot_auth_Router);
app.use('/api/inventorie/kot/send/to/kitchen',checkTokenID,newMiddleWear,KOT_send_to_kitchen);
app.use('/api/inventorie/fastorderkot/send/to/kitchen',checkTokenID,newMiddleWear,fastOrder_KOT_send_to_kitchen);
app.use('/api/orderInventorieRoutes',newMiddleWear,orderInventorieRoutes);




// --------Room

app.use('/api/room',checkTokenID,roomRoutes);
app.use('/api/roominventorie',checkTokenID,newMiddleWear,orderRoomRoutes);
app.use('/api/customer/roominventorie',customerRoomOrderRoute);
app.use('/api/user/roomnotification',notificationroomRouter);


app.use('/api/roomorderInventorieRoutes',newMiddleWear,roomorderInventorieRoutes);
app.use('/api/roominventorie/kot/send/to/kitchen',checkTokenID,newMiddleWear,room_KOT_send_to_kitchen);

// ------Waiter
app.use('/api/waiter/shop',checkTokenID,shopWaiterRoutes);
app.use('/api/waiter',WaiterRoutes);
app.use('/api/waiter/table',checkWaiterTokenID,WaitertableRoutes);
app.use('/api/waiter/inventorie',checkWaiterTokenID,WaitertableRoutes);

app.use('/api/waiter/inventoriesave',checkWaiterTokenID,newMiddleWear,WaitertableRoutes2);


server.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
