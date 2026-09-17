const cors = require("cors");
// CORS 설정을 위해 사용할 cors 모듈
const express = require("express");
// Express 서버 설정
const app = express();
// 포트 설정
const PORT = 3000;
// 라우트 설정
const pool = require("./db");
// 데이터베이스 연결
const bcrypt = require("bcrypt");
// 비밀번호 암호화에 사용할 bcrypt 모듈
const jwt = require("jsonwebtoken");
// JWT 토큰 생성을 위해 사용할 jsonwebtoken 모듈

app.use(express.json());
// JSON 요청 처리 미들웨어 설정

app.use(cors());
// CORS 미들웨어 설정

// 인증이 필요한 라우트에서 사용할 미들웨어 함수
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "로그인이 필요합니다" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "유효하지 않거나 만료된 토큰입니다" });
  }
}

app.get("/", (req, res) => {
    // 루트 경로 요청 처리
  res.send("서버가 잘 실행되고 있어요!");
  // 응답 완료
});

// 데이터베이스 연결 테스트 라우트
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

// 게시글 목록 조회
app.get("/posts", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM posts ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "게시글 목록 조회 실패" });
  }
});

// 게시글 상세 조회
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [postRows] = await pool.query("SELECT * FROM posts WHERE id = ?", [id]);

    if (postRows.length === 0) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
    }

    // 조회할 때마다 조회수 1 증가
    await pool.query("UPDATE post_views SET view_count = view_count + 1 WHERE post_id = ?", [id]);

    const [viewRows] = await pool.query("SELECT view_count FROM post_views WHERE post_id = ?", [id]);
    const [comments] = await pool.query(
      "SELECT id, content, user_id, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC",
      [id]
    );

    res.json({
      ...postRows[0],
      view_count: viewRows[0]?.view_count ?? 0,
      comments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "게시글 조회 실패" });
  }
});

// 게시글 작성
app.post("/posts", requireAuth, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "제목과 내용을 모두 입력해주세요" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)",
      [title, content, req.user.userId]
    );

    // 게시글 생성과 동시에, 조회수 0으로 시작하는 레코드도 만들어둠
    await pool.query("INSERT INTO post_views (post_id, view_count) VALUES (?, 0)", [result.insertId]);

    res.status(201).json({ id: result.insertId, title, content, user_id: req.user.userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "게시글 작성 실패" });
  }
});

// 게시글 수정
app.put("/posts/:id", async (req, res) => {
  const { title, content } = req.body;
  const { id } = req.params;

  if (!title || !content) {
    return res.status(400).json({ error: "제목과 내용을 모두 입력해주세요" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE posts SET title = ?, content = ? WHERE id = ?",
      [title, content, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
    }

    res.json({ id: Number(id), title, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "게시글 수정 실패" });
  }
});

// 게시글 삭제
app.delete("/posts/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT user_id FROM posts WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
    }

    if (rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: "본인이 작성한 게시글만 삭제할 수 있습니다" });
    }

    await pool.query("DELETE FROM posts WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "게시글 삭제 실패" });
  }
});

// 회원가입
app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 모두 입력해주세요" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, passwordHash]
    );

    res.status(201).json({ id: result.insertId, email });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "이미 가입된 이메일입니다" });
    }
    console.error(err);
    res.status(500).json({ error: "회원가입 실패" });
  }
});

// 로그인
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 모두 입력해주세요" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "로그인 실패" });
  }
});

// 댓글 작성
app.post("/posts/:id/comments", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "댓글 내용을 입력해주세요" });
  }

  try {
    const [postRows] = await pool.query("SELECT id FROM posts WHERE id = ?", [id]);
    if (postRows.length === 0) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
    }

    const [result] = await pool.query(
      "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [id, req.user.userId, content]
    );

    res.status(201).json({ id: result.insertId, post_id: id, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "댓글 작성 실패" });
  }
});