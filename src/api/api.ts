import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3001",
});

export function setAuthToken(token: string) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}