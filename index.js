const express = require("express");
const axios = require("axios");

const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT;

app.listen(port, () => {
    console.log(`app is running at localhost: ${port}}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cors());

app.get("/", (req, res) => {
    res.send('<h1>Mpesa Integration</h1>');
});

app.get("/token", (req, res) => {
    generateToken();
})

// middleware function to generate token
const generateToken = async (req, res, next) => {
    const secret = process.env.CONSUMER_SECRET;
    const consumerKey = process.env.CONSUMER_KEY;

    const auth = new Buffer.from(`${consumerKey}:${secret}`).toString('base64');
    await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
        headers: {
            Authorization: `Basic ${auth}`
        }
    }).then((response) => {
        console.log(response.data.access_token);
        token = response.data.access_token;
        // next();
    })
    .catch((err) => {
        console.log(err);
        // res.status(400).json(err.message);
    })
}

app.post("/stk", generateToken, async (req, res) => {
    const phone = req.body.phone.substring(1);
    const amount = req.body.amount;
    

    const date = new Date();
    const timeStamp = date.getFullYear() + 
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

    const shortCode = process.env.SHORTCODE;
    const passKey = process.env.PASSKEY;

    const password = new Buffer.from(shortCode + passKey + timeStamp).toString(
        "base64"
    );

        await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode: shortCode,
                Password: password,
                Timestamp: timeStamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: `254${phone}`,
                PartyB: shortCode,
                PhoneNumber: `254${phone}`,
                CallBackURL: "https://mydomain.com/pat",
                AccountReference: `Sanity Pay 254${phone}`,
                TransactionDesc: "Test",
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        ).then((data) => {
            console.log(data.data)
            res.status(200).json(data.data)
        }).catch((err) => {
            console.log(err.message)
            res.status(400).json(err.message);
        })
})