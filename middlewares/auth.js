const { getToken, getKotToken, getWaiterToken } = require("../constants/auth");

async function checkTokenID(req, res, next) {
  const userToken = req?.headers?.authorization;
  const token = userToken?.split(" ")[1];
  if (!token) return res.status(400).json({ msg: "First Login for other requests.." });
  const user = getToken(token);
  if (!user) return res.status(400).json({ msg: "Un-Authenticated User" });
  req.body.authUser = user;
  next();
}

async function checkKotTokenID(req, res, next) {
  const userToken = req?.headers?.authorization;
  const token = userToken?.split(" ")[1];
  if (!token) return res.status(400).json({ msg: "KOT First Login for other requests.." });
  const user = getKotToken(token);
  if (!user) return res.status(400).json({ msg: "KOT Un-Authenticated User" });
  req.body.authUser = user;
  next();
}

async function checkWaiterTokenID(req, res, next) {
  const userToken = req?.headers?.authorization;
  const token = userToken?.split(" ")[1];
  const user = getWaiterToken(token);
  if (!user) return res.status(400).json({ msg: "Waiter Un-Authenticated User" });
  req.body.authUser = user;
  next();
}
module.exports = {
  checkTokenID,
  checkKotTokenID,
  checkWaiterTokenID
};
