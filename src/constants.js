
// Redirect status Codes
module.exports.http_redirect = [
    300,
    301,
    302,
    303,
    304,
    305,
    306,
    307,
    308
];

//Available Http methods
module.exports.http_methods = [
    'GET',
    'PUT',
    'POST',
    'PATCH',
    'HEAD',
    'OPTIONS',
    'DELETE'
];

module.exports.no_301_301_http_methods = [
    'PUT',
    'POST',
    'PATCH',
];