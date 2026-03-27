const express = require("express");
const cors = require("cors");
const { SmartAPI } = require("smartapi-javascript");

const app = express();

// 1. BULLETPROOF CORS (Prevents "Load failed" on frontend)
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// 2. INITIALIZE SMARTAPI
let smart_api = new SmartAPI({
    api_key: process.env.ANGEL_API_KEY 
});

// 3. LOGIN ENDPOINT
app.post('/login', async (req, res) => {
    try {
        const { clientcode, password, totp } = req.body;
        if (!clientcode || !password || !totp) throw new Error("Missing login credentials");

        const session = await smart_api.generateSession(clientcode, password, totp);
        
        if (session.status) {
            res.json({ status: true, data: session.data });
        } else {
            res.status(401).json({ status: false, message: session.message || "Invalid Credentials" });
        }
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ status: false, message: err.message });
    }
});

// 4. CANDLE FETCH ENDPOINT
app.get('/candles', async (req, res) => {
    try {
        const { exchange, symboltoken, interval, fromdate, todate } = req.query;
        
        const payload = {
            exchange: exchange || "NSE",
            symboltoken: symboltoken || "26000",
            interval: interval || "FIVE_MINUTE",
            fromdate: fromdate, 
            todate: todate      
        };

        const data = await smart_api.getCandleData(payload);
        
        if (data.status) {
            res.json({ status: true, data: data.data });
        } else {
            res.status(400).json({ status: false, message: data.message || "Angel One rejected the candle request" });
        }
    } catch (err) {
        console.error("Candle Error:", err.message);
        res.status(500).json({ status: false, message: err.message });
    }
});

// 5. LIVE TICK (LTP) ENDPOINT
app.get('/nifty', async (req, res) => {
    try {
        const data = await smart_api.getLTPData({
            exchange: "NSE",
            tradingsymbol: "NIFTY",
            symboltoken: "26000"
        });
        
        if (data.status) {
            res.json({ status: true, data: data.data });
        } else {
            res.status(400).json({ status: false, message: data.message });
        }
    } catch (err) {
        console.error("LTP Error:", err.message);
        res.status(500).json({ status: false, message: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Angel One Proxy running on port ${PORT}`);
});
