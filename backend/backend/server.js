require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const https = require("https");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

app.get("/", (req, res) => {
    res.send("Antigravity backend running 🚀");
});

// ── TTS Proxy: Fetches Google Translate TTS audio server-side ──
// Client calls: GET /tts?text=...&lang=te
// Returns: audio/mpeg stream from Google TTS
app.get("/tts", (req, res) => {
    const text = req.query.text || "";
    const lang = req.query.lang || "en";

    if (!text.trim()) {
        return res.status(400).send("No text provided");
    }

    const encoded = encodeURIComponent(text);
    const gtUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob&ttsspeed=0.85`;

    const options = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://translate.google.com/",
            "Accept": "*/*"
        }
    };

    https.get(gtUrl, options, (gRes) => {
        if (gRes.statusCode !== 200) {
            console.error(`[TTS] Google returned ${gRes.statusCode}`);
            return res.status(502).send("TTS fetch failed");
        }
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "no-cache");
        gRes.pipe(res);
    }).on("error", (err) => {
        console.error("[TTS] Proxy error:", err.message);
        res.status(500).send("TTS proxy error");
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`)
);