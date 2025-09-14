const siteInfo = (req, res, next)=>{
    res.setHeader("X-Powered-By", appName);
    res.setHeader("cfd", version);
    next();
}
