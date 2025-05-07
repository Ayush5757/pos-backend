const jwt = require("jsonwebtoken");
const secKey = process.env.SECRET_KEY_AUTH1;

function createToken(data) {
  if (!data) return null;
  try {
    return jwt.sign({
      _id: data._id,
      shopEmail: data.shopEmail,
    }, secKey);
  } catch (error) {
    return null;
  }
}

function getToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, secKey);
  } catch (error) {
    return null;
  }
}

const secKotKey = process.env.SECRET_KEY_AUTH2;
function createKotToken(data) {
  if (!data) return null;
  try {
    return jwt.sign({
      _id: data._id,
      shopID: data.shopID,
      user_name: data.user_name
    }, secKotKey);
  } catch (error) {
    return null;
  }
}
function getKotToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, secKotKey);
  } catch (error) {
    return null;
  }
}

const secWaiterKey = process.env.SECRET_KEY_AUTH3;
function createWaiterToken(data) {
  if (!data) return null;
  try {
    return jwt.sign({
      _id: data._id,
      shopID: data.shopID,
      user_name: data.user_name
    }, secWaiterKey);
  } catch (error) {
    return null;
  }
}
function getWaiterToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, secWaiterKey);
  } catch (error) {
    return null;
  }
}

module.exports = {
  createToken,
  getToken,
  createKotToken,
  getKotToken,
  createWaiterToken,
  getWaiterToken
};
