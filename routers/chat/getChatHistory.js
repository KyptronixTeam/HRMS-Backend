const express = require("express");
const Message = require("../../database/Models/Message");
const mongoose = require("mongoose");
const router = express.Router();

// Get chat history between two users
router.get("/:senderId/:receiverId", async (req, res) => {
    try {
        const senderId = new mongoose.Types.ObjectId(req.params.senderId);
        const receiverId = new mongoose.Types.ObjectId(req.params.receiverId);

        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Get all messages
router.get("/all-message", async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ createdAt: 1 })
            .lean(); // lean() improves performance by returning plain JavaScript objects

        res.json(messages);
    } catch (error) {
        console.error("Error fetching all messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
