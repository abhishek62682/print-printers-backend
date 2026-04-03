// helpers/getClientIP.js

const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  if (forwarded) {
    // X-Forwarded-For can be a comma-separated list: "client, proxy1, proxy2"
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback to direct connection IP
  return req.socket.remoteAddress || req.ip;
};

export default getClientIP;