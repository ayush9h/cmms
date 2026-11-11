const api = (process.env.API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

if (process.env.VERCEL && !process.env.API_URL) throw new Error("Set API_URL to the Render backend URL, e.g. https://your-api.onrender.com");

export default {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};
