const express = require("express");
const dotenv = require("dotenv");
const app = express();
dotenv.config();
const db = require("./config/db");

// Middleware พื้นฐาน
app.use(express.json());

// นำเข้า "สารบัญ" หลัก (routes/index.js)
const mainRoutes = require("./routes");

// Route ทดสอบ
app.get("/", (req, res) => {
  res.send("Mini Task API Running...");
});

// ใช้งาน Routes ทั้งหมดผ่าน "สารบัญ"
app.use(mainRoutes);

// นำเข้า Error Handler กลาง
const errorHandler = require("./middlewares/errorHandler");

// ลงทะเบียน Error Handler (ต้องอยู่ล่างสุด)
app.use(errorHandler);

// เริ่มเซิร์ฟเวอร์
app.listen(process.env.PORT || 8100, () => {
  console.log(`Server running on port ${process.env.PORT || 8100}`);
});
