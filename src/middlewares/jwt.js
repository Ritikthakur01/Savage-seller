
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';

const { secret_key } = config;

export const generateToken = (userId,email,username) => {

  const token = jwt.sign(
    { user: { id : userId, email, username } },
    secret_key,
    { expiresIn: "1h" }
  );
  return token;
};

export const authenticateUser = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(201).json({   
      success: false,
      message: "Unauthorized: Missing token",
    });
  }
  
  try {
    const decoded = jwt.verify(token, secret_key);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(201).json({
      success: false,
      message: "Unauthorized: Invalid token",
    });
  }
};


