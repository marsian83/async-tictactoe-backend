const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    player1: { type: String, required: true },
    player2: { type: String, required: true },
    state: { type: String, required: true, default: "wait/p1" },
    board: {
      type: Array,
      required: true,
      default: ["", "", "", "", "", "", "", "", ""],
    },
  },
  { timestamps: true }
);

const Game = mongoose.model("Game", schema);

module.exports = Game;
