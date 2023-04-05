const {parseResponseCookie} = require('../../../../src/common/http_utils.js');


test('Parses Cookie correctly',()=>{
    const cookie = 'sessionToken=abc123; Expires=Wed, 09 Jun 2021 10:18:14 GMT';

    const parsedCookie = parseResponseCookie(cookie);
   
    expect(parsedCookie.httpOnly).toBe(false);
    expect(parsedCookie.secure).toBe(false);
    expect(parsedCookie.samesite_policy).toBe("Lax");
    expect(parsedCookie.partitioned).toBe(false);
    expect(parsedCookie['max-age']).toBe(null);

    expect(parsedCookie.name).toBe('sessionToken');
    expect(parsedCookie.value).toBe('abc123');
    expect(parsedCookie.expires).toBe('Wed, 09 Jun 2021 10:18:14 GMT');
});

test('Parses securt httponly cookie',()=>{
    const cookie = 'SSID=312321; Domain=foo.com; Path=/; Expires=Wed, 13 Jan 2021 22:23:01 GMT; Secure; HttpOnly';

    const parsedCookie = parseResponseCookie(cookie);
   
    expect(parsedCookie.httpOnly).toBe(true);
    expect(parsedCookie.secure).toBe(true);
    expect(parsedCookie.samesite_policy).toBe("Lax");
    expect(parsedCookie.partitioned).toBe(false);
    expect(parsedCookie['max-age']).toBe(null);

    expect(parsedCookie.name).toBe('SSID');
    expect(parsedCookie.value).toBe('312321');
    expect(parsedCookie.expires).toBe('Wed, 13 Jan 2021 22:23:01 GMT');

    expect(parsedCookie.path).toBe('/');
});

test('SameSitePolicy none',()=>{
    const cookie = 'flavor=choco; SameSite=None; Secure';

    const parsedCookie = parseResponseCookie(cookie);

     
    expect(parsedCookie.httpOnly).toBe(false);
    expect(parsedCookie.secure).toBe(true);
    expect(parsedCookie.samesite_policy).toBe("None");
    expect(parsedCookie.partitioned).toBe(false);
    expect(parsedCookie['max-age']).toBe(null);

    expect(parsedCookie.name).toBe('flavor');
    expect(parsedCookie.value).toBe('choco');
    expect(parsedCookie.expires).toBe(null);
});

test('SameSitePolicy lax',()=>{
    const cookie = 'flavor=choco; SameSite=Lax; Secure';

    const parsedCookie = parseResponseCookie(cookie);

     
    expect(parsedCookie.httpOnly).toBe(false);
    expect(parsedCookie.secure).toBe(true);
    expect(parsedCookie.samesite_policy).toBe("Lax");
    expect(parsedCookie.partitioned).toBe(false);
    expect(parsedCookie['max-age']).toBe(null);

    expect(parsedCookie.name).toBe('flavor');
    expect(parsedCookie.value).toBe('choco');
    expect(parsedCookie.expires).toBe(null);
})

test('SameSitePolicy lax',()=>{
    const cookie = 'flavor=choco; SameSite=Strict; Secure';

    const parsedCookie = parseResponseCookie(cookie);

     
    expect(parsedCookie.httpOnly).toBe(false);
    expect(parsedCookie.secure).toBe(true);
    expect(parsedCookie.samesite_policy).toBe("Strict");
    expect(parsedCookie.partitioned).toBe(false);
    expect(parsedCookie['max-age']).toBe(null);

    expect(parsedCookie.name).toBe('flavor');
    expect(parsedCookie.value).toBe('choco');
    expect(parsedCookie.expires).toBe(null);
})

test('Domain and Path',()=>{
    const cookie = 'flavor=choco; SameSite=Strict; Domain=example.com; Path=/chucknorris; Secure';

    const parsedCookie = parseResponseCookie(cookie);

     
    expect(parsedCookie.httpOnly).toBe(false);
    expect(parsedCookie.secure).toBe(true);
    expect(parsedCookie.samesite_policy).toBe("Strict");
    expect(parsedCookie.partitioned).toBe(false);
    expect(parsedCookie['max-age']).toBe(null);

    expect(parsedCookie.name).toBe('flavor');
    expect(parsedCookie.value).toBe('choco');
    expect(parsedCookie.expires).toBe(null);

    expect(parsedCookie.path).toBe('/chucknorris');
    expect(parsedCookie.domain).toBe('example.com');

})
