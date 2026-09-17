import { useState, useEffect } from "react";
import { getPost, addComment, deletePost } from "./api";

function PostDetail({ postId, token, onDeleted }) {
  const [post, setPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");

  // postId가 바뀔 때마다(다른 글을 클릭할 때마다) 자동으로 다시 불러옴.
  // 의존성 배열에 postId를 넣었기 때문에, postId가 바뀔 때만 재실행돼요.
  useEffect(() => {
    loadPost();
  }, [postId]);

  async function loadPost() {
    try {
      const data = await getPost(postId);
      setPost(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddComment() {
    if (!token) {
      alert("먼저 로그인해주세요");
      return;
    }
    if (!newComment.trim()) return;

    try {
      await addComment(token, postId, newComment);
      setNewComment("");
      loadPost(); // 댓글 목록 새로고침 (조회수도 함께 1 증가함)
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!token) {
      alert("먼저 로그인해주세요");
      return;
    }
    if (!confirm("정말 삭제하시겠어요?")) return;

    try {
      await deletePost(token, postId);
      onDeleted(); // App에게 "삭제됐으니 목록으로 돌아가" 알림
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!post) return <p className="muted">불러오는 중...</p>;

  return (
    <section className="box">
      <h3>
        #{post.id} {post.title}
      </h3>
      <p>{post.content}</p>
      <p className="muted">조회수: {post.view_count ?? 0}</p>
      <button onClick={handleDelete} className="danger">
        삭제
      </button>

      <h4>댓글</h4>
      {post.comments && post.comments.length > 0 ? (
        post.comments.map((c) => (
          <div key={c.id} className="comment">
            💬 {c.content}
          </div>
        ))
      ) : (
        <p className="muted">아직 댓글이 없어요.</p>
      )}

      <div className="button-row">
        <input
          type="text"
          placeholder="댓글 입력"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button onClick={handleAddComment}>댓글 작성</button>
      </div>
    </section>
  );
}

export default PostDetail;
