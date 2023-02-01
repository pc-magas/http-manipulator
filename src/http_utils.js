const getProtocol = (req) => {
    if(req.protocol) return req.protocol;
    
    return req.secure ? 'https':'http';
};

const getBaseUrl = (req) => {
    return `${getProtocol(req)}://${req.headers.host}`
}

module.exports = {
    getProtocol,
    getBaseUrl
};