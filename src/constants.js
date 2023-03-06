
// Redirect status Codes
const http_redirect = [
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

const success_status_codes = [
    200,
    201,
    202,
    203,
    204,
    205,
    206,
    207,
    208,
    209,
];

const error_status_codes = [
    400,
    401,
    402,
    403,
    404,
    405,
    406,
    407,
    408,
    409,
    410,
    411,
    402,
    413,
    414,
    415,
    416,
    417,
    418,
    421,
    422,
    423,
    424,
    425,
    426,
    427,
    428,
    429,
    431,
    451,
    500,
    501,
    502,
    503,
    504,
    505,
    506,
    507,
    508,
    510,
    511
];

const http_status_code = [
    100,
    101,
    102,
    103,
    ...success_status_codes,
    ...http_redirect,
    305,
    306,
    ...error_status_codes
];

const http_methods = [
    'GET',
    'PUT',
    'POST',
    'PATCH',
    'HEAD',
    'OPTIONS',
    'DELETE'
];

module.exports = {
    http_status_code,
    http_redirect,
    success_status_codes,
    error_status_codes,
    http_status_code_as_string: http_status_code.join(),
    http_methods,
    http_methods_as_string_quoted: http_methods.join(),
    no_301_302_http_methods : [
        'PUT',
        'POST',
        'PATCH',
    ]
}