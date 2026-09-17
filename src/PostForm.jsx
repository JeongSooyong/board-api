import { useState } from "react";
import { createPost } from "./api";

function PostForm({ token, onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("먼저 로그인해주세요");
      return;
    }

    try {
      await createPost(token, title, content);
      setTitle("");
      setContent("");
      onCreated(); // App에게 "새 글 생겼으니 목록 다시 불러와" 알림
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="box">
      <h3>새 글 작성</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="내용"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit">작성</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default PostForm;
