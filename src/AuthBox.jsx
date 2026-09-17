import { useState } from "react";
import { signup, login } from "./api";

// 부모(App)로부터 onLoggedIn 함수를 props로 받아서,
// 로그인 성공 시 그 함수를 호출해 토큰을 위로 전달해요.
function AuthBox({ onLoggedIn, currentEmail }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSignup() {
    setError("");
    try {
      await signup(email, password);
      alert("회원가입 완료! 이제 로그인하세요.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogin() {
    setError("");
    try {
      const { token } = await login(email, password);
      onLoggedIn(token, email);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="box">
      <h3>회원가입 / 로그인</h3>
      {currentEmail && <p className="status">로그인됨: {currentEmail}</p>}
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="button-row">
        <button onClick={handleSignup}>회원가입</button>
        <button onClick={handleLogin}>로그인</button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default AuthBox;
