const router = require('koa-router')()
const redis = require("redis");
const bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const uuid = require('node-uuid');
const moment = require('moment');
const redisConfing = require('../config/redis');
let q = 'seckill';


router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.get('/seckill', async (ctx, next) => {
  let producer = ctx.producer || await require('amqplib').connect('amqp://localhost');
  let fn = async function (optionalClient) {
    let client;
    if (optionalClient == 'undefined' || optionalClient == null) {
      client = redis.createClient(redisConfing);
    } else {
      client = optionalClient;
    }
    client.on('error', function (er) {
      console.error(er.stack);
      client.end(true);
    });
    client.watch("counter");//监听counter字段
    let reply = await client.getAsync('counter');
    if (parseInt(reply) > 0) {
      let multi = await client.multi();
      multi.decr('counter');//更新redis的counter数量减一。
      let replies = await multi.execAsync();
      console.log(replies)
      if (replies == null) {//counter字段正在操作中，等待counter被其他释放
        console.log("counter被使用");
        await fn(client);
      } else {
        var args = {
          openid: uuid.v4().replace(/-/g, ""),
          seckillTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        }
        payload = {
          topic: 'PROUDCT_NUMBER',
          messages: JSON.stringify(args),
          key: "seckill",
        };
        console.log("payload:", payload);
        payload = JSON.stringify(payload);
        const ch = await producer.createChannel();
        const res = await ch.assertQueue(q);
        if (typeof res.messageCount !== 'undefined') {
          await ch.sendToQueue(q, Buffer.from(payload));
        }
        client.end(true);
        ctx.body = replies;
      }

    } else {
      console.log("已经卖光了");
      client.end(true);
      ctx.body = "已经卖光了";
      return;
    }
  }
  await fn(null);
  // payload.count = global.count;
  // ctx.body = payload;
}
)

module.exports = router
