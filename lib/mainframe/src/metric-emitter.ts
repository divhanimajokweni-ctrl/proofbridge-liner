import express from "express";

const app = express();
app.use(express.json());

console.log("Mainframe metric emitter started on port 3005");

app.get("/metrics/breach", (req, res) => {
  res.json({ ok: true });
});

app.listen(3005);
