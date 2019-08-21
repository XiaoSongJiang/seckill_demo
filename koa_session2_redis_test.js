const Koa = require("koa");
const session = require("koa-session2");
const Store = require("./Store.js");

const app = new Koa();
// const CONFIG = {
//     key: 'koa:sess', /** (string) cookie key (default is koa:sess) */
//     /** (number || 'session') maxAge in ms (default is 1 days) */
//     /** 'session' will result in a cookie that expires when session/browser is closed */
//     /** Warning: If a session cookie is stolen, this cookie will never expire */
//     maxAge: 86400000,
//     autoCommit: true, /** (boolean) automatically commit headers (default true) */
//     overwrite: true, /** (boolean) can overwrite or not (default true) */
//     httpOnly: true, /** (boolean) httpOnly or not (default true) */
//     signed: true, /** (boolean) signed or not (default true) */
//     rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
//     renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
// };
app.use(session({
    key: 'SESSIONID',
    store: new Store()
}));

app.use(ctx => {
    if (ctx.path === '/favicon.ico') return;

    let n = ctx.session.views || 0;
    // console.log(ctx.cookies.get('koa:sess'))
    ctx.session.views = ++n;
    // ctx.session = null
    ctx.body = n + ' views';
});

app.use(ctx => {
    // refresh session if set maxAge
    ctx.session.refresh()
})
app.listen(5000);
console.log('listening on port 5000');