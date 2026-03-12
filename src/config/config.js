



const _config = {
    port : process.env.PORT || 8000,
    databaseUrl: process.env.MONGO_CONNECTION_STRING,
    env: process.env.NODE_ENV || "development",
    jwtSecret: process.env.JWT_SECRET,
    frontendDomain: process.env.FRONTEND_DOMAIN,
}

export const config =   Object.freeze(_config);