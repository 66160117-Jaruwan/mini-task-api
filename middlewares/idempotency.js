const pool = require("../config/db");

function hashBody(body) {
  const s = JSON.stringify(body || {});
  return crypto.createHash("sha256").update(s).digest("hex");
}

module.exports = function idempotencyMiddleware(expireSeconds = 24 * 3600) {
  return async (req, res, next) => {
    const key = req.headers["idempotency-key"];
    if (!key) {
      // ⭐️ แก้ไข: โยน Error 400
      const err = new Error("Idempotency-Key header required");
      err.statusCode = 400;
      err.code = "MISSING_IDEMPOTENCY_KEY";
      return next(err);
    }
    const userId = req.user ? req.user.id : null;
    const requestHash = hashBody(req.body);

    try {
      const [rows] = await pool.query(
        "SELECT * FROM idempotency_keys WHERE idempotency_key = ? AND user_id = ?",
        [key, userId]
      );
      const now = new Date();

      if (rows.length) {
        const row = rows[0];
        if (row.expires_at && new Date(row.expires_at) < now) {
          await pool.query(
            "DELETE FROM idempotency_keys WHERE idempotency_key = ? AND user_id = ?",
            [key, userId]
          );
        } else {
          if (row.request_hash === requestHash) {
            const cached = row.response_body;
            if (cached) {
              res.setHeader("Idempotency-Replayed", "true");
              res.setHeader("Content-Type", "application/json");
              return res.status(200).send(JSON.parse(cached));
            }
          } else {
            // ⭐️ แก้ไข: โยน Error 409
            const err = new Error(
              "Same Idempotency-Key used with different request body"
            );
            err.statusCode = 409;
            err.code = "IDEMPOTENCY_CONFLICT";
            return next(err);
          }
        }
      } // Wrap res.send เพื่อดักจับ response

      const originalSend = res.send.bind(res);
      res.send = function (body) {
        try {
          const responseStr =
            typeof body === "string" ? body : JSON.stringify(body);
          const expiresAt = new Date(Date.now() + expireSeconds * 1000);
          pool
            .query(
              `INSERT INTO idempotency_keys (idempotency_key, user_id, request_hash, response_body, expires_at)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE response_body = VALUES(response_body), request_hash = VALUES(request_hash), expires_at = VALUES(expires_at)`,
              [key, userId, requestHash, responseStr, expiresAt]
            )
            .catch((err) =>
              console.error("Failed to persist idempotency key", err)
            );
        } catch (e) {
          console.error("Error capturing response for idempotency", e);
        }
        return originalSend(body);
      };
      next();
    } catch (err) {
      next(err);
    }
  };
};
