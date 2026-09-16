const express = require("express");
// Express 서버 설정
const app = express();
// 포트 설정
const PORT = 3000;
// 라우트 설정
const pool = require("./db");
// 데이터베이스 연결

app.get("/", (req, res) => {
    // 루트 경로 요청 처리
  res.send("서버가 잘 실행되고 있어요!");
  // 응답 완료
});

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
    // 서버 시작 완료
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

