function PostList({ posts, onSelect }) {
  if (posts.length === 0) {
    return <p className="muted">아직 게시글이 없어요.</p>;
  }

  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.id} onClick={() => onSelect(post.id)}>
          #{post.id} {post.title}
        </li>
      ))}
    </ul>
  );
}

export default PostList;
