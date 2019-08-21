var q = 'seckill';
const mongoose = require('mongoose');
const model = (async function () {
    const con = await mongoose.connect('mongodb://localhost:27017/seckill_test',
        {
            useNewUrlParser: true,
        });
    try {
        const seckill = mongoose.model('seckill', {
            openid: {
                type: String
            },
            seckillTime: { type: String },
        });
        return seckill;
    } catch (error) {
        console.log(error.message);
    }
    // con.connection.close()
})();
var open = require('amqplib').connect('amqp://localhost');

// Consumer
open.then(function (conn) {
    return conn.createChannel();
}).then(function (ch) {
    return ch.assertQueue(q).then(function (ok) {
        return ch.consume(q, function (msg) {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString())
                console.log("content", msg.content.toString());
                model.then(seckill => {
                    seckill.create(JSON.parse(data.messages));
                    ch.ack(msg);
                });
            }
        });
    });
}).catch(console.warn);