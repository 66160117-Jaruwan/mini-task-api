// middlewares/idempotency.js
const pool = require("../db");
const crypto = require("crypto");

function hashBody(body) {
  const s = JSON.stringify(body || {});
  return crypto.createHash("sha256").update(s).digest("hex");
}

module.exports = function idempotencyMiddleware(expireSeconds = 24 * 3600) {
  return async (req, res, next) => {
    // Only for methods that require idempotency: POST /tasks (explicit), PATCH /tasks/:id/status (optional)
    const key = req.headers["idempotency-key"];
    if (!key) {
      return res
        .status(400)
        .json({
          error: {
            code: "MISSING_IDEMPOTENCY_KEY",
            message: "Idempotency-Key header required",
          },
        });
    }
    const userId = req.user ? req.user.id : null;
    const requestHash = hashBody(req.body);

    try {
      // Check if key exists
      const [rows] = await pool.query(
        "SELECT * FROM idempotency_keys WHERE idempotency_key = ? AND user_id = ?",
        [key, userId]
      );
      const now = new Date();

      if (rows.length) {
        const row = rows[0];
        // expired?
        if (row.expires_at && new Date(row.expires_at) < now) {
          // treat as new (delete old)
          await pool.query(
            "DELETE FROM idempotency_keys WHERE idempotency_key = ? AND user_id = ?",
            [key, userId]
          );
        } else {
          // key exists -> check request hash
          if (row.request_hash === requestHash) {
            // return stored response
            const cached = row.response_body;
            if (cached) {
              // header to show idempotent hit
              res.setHeader("Idempotency-Replayed", "true");
              res.setHeader("Content-Type", "application/json");
              return res.status(200).send(JSON.parse(cached));
            } else {
              // no cached response, allow processing (rare)
            }
          } else {
            // conflict: same key different body
            return res
              .status(409)
              .json({
                error: {
                  code: "IDEMPOTENCY_CONFLICT",
                  message:
                    "Same Idempotency-Key used with different request body",
                },
              });
          }
        }
      }

      // Wrap res.send to capture response body for caching
      const originalSend = res.send.bind(res);
      let responseBodyCaptured = null;

      res.send = function (body) {
        try {
          // Save response body into DB as JSON string (but be careful on large payloads)
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

      // proceed
      next();
    } catch (err) {
      next(err);
    }
  };
};
