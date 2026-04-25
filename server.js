const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

const sessions = new Map();

function generateCode() {
  return (
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

wss.on("connection", (ws, req) => {

  let sessionCode = null;

  ws.on("message", (raw) => {
    const data = JSON.parse(raw);

    // CREATE SESSION
    if (data.type === "create") {
      const code = generateCode();
      sessionCode = code;

      sessions.set(code, { host: ws, partner: null });

      ws.send(JSON.stringify({ type: "code", code }));
    }

    // JOIN SESSION
    if (data.type === "join") {
      const session = sessions.get(data.code);
      if (!session) return;

      session.partner = ws;

      ws.partner = session.host;
      session.host.partner = ws;

      ws.send(JSON.stringify({ type: "joined" }));
      session.host.send(JSON.stringify({ type: "joined" }));
    }

    // MESSAGE RELAY (no storage)
    if (data.type === "msg") {
      if (ws.partner) {
        ws.partner.send(JSON.stringify({
          type: "msg",
          payload: data.payload
        }));
      }
    }

    // REPORT (basic flag hook)
    if (data.type === "report") {
      console.log("Report received for session:", sessionCode);
    }
  });

  ws.on("close", () => {
    if (sessionCode) sessions.delete(sessionCode);
  });
});

console.log("888ase server running");
