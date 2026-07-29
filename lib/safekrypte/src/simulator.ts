import express from "express";

const app = express();
app.use(express.json());

console.log("Safekrypte simulator started on port 3001");

app.post("/sign", (req, res) => {
  const { payload, keyId } = req.body;
  const signature = "0x" + Math.random().toString(16).substring(2, 66);
  res.json({ signature });
});

app.listen(3001);
