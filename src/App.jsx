import { useState, useEffect } from "react";
import AuthBox from "./AuthBox";
import PostForm from "./PostForm";
import PostList from "./PostList";
import PostDetail from "./PostDetail";
import { getPosts } from "./api";

function App() {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState("");
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // 페이지가 처음 열릴 때 딱 한 번만 게시글 목록을 불러옴 (의존성 배열이 빈 배열이기 때문)
  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  }

  function handleLoggedIn(newToken, newEmail) {
    setToken(newToken);
    setEmail(newEmail);
  }

  function handlePostCreated() {
    loadPosts(); // 목록 새로고침
  }

  function handlePostDeleted() {
    setSelectedPostId(null); // 상세 화면 닫고
    loadPosts(); // 목록도 새로고침
  }

  return (
    <div className="page">
      <h1>📋 게시판</h1>

      <AuthBox onLoggedIn={handleLoggedIn} currentEmail={email} />
      <PostForm token={token} onCreated={handlePostCreated} />

      <section className="box">
        <h3>게시글 목록</h3>
        <PostList posts={posts} onSelect={setSelectedPostId} />
      </section>

      {selectedPostId && (
        <PostDetail
          postId={selectedPostId}
          token={token}
          onDeleted={handlePostDeleted}
        />
      )}
    </div>
  );
}

export default App;
