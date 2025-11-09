// middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // แสดง Error ใน console

  // 1. กำหนด statusCode (ถ้า err ไม่มี .statusCode ให้ใช้ 500)
  const statusCode = err.statusCode || 500;

  // 2. สร้าง Response format ตามข้อกำหนด
  const errorResponse = {
    status: "error",
    code: err.code || (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "ERROR"),
    message: err.message || "An unexpected error occurred",
  };

  // 3. ส่ง Response กลับไป
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
