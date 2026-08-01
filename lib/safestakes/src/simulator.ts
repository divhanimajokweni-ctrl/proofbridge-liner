import express from "express";

const app = express();
app.use(express.json());

console.log("Safestakes simulator started on port 3002");

const executedIds = new Set<string>();

app.post("/execute-slash", (req, res) => {
  const { incidentReportId, idempotencyKey } = req.body;
  if (executedIds.has(idempotencyKey)) {
    res.json({ executed: false, reason: "DUPLICATE_EXECUTION" });
  } else {
    executedIds.add(idempotencyKey);
    res.json({ executed: true, newBalance: 50000000, txId: `tx-${incidentReportId}` });
  }
});

app.listen(3002);
