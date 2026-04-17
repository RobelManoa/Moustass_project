import { useState } from "react";
import { api, setAuthToken } from "../api/api";

export default function Login() {
  const [email, setEmail] = useState("");

  const handleLogin = async () => {
    const res = await api.post("/auth/login", { email });
    setAuthToken(res.data.token);
    localStorage.setItem("token", res.data.token);
    window.location.href = "/messages";
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}