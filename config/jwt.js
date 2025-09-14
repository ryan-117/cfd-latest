// jwt 配置
export let jwt = {
  JWT_SECRET: process.env.JWT_SECRET || "CFD",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  JWT_REFRESH: process.env.JWT_REFRESH || false, //是否开启刷新token
};

