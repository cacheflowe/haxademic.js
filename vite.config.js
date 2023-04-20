import basicSsl from "@vitejs/plugin-basic-ssl";

// we can also set host/port in package.json:
// "dev": "vite --port 8002 --host 192.168.1.155"

export default {
  plugins: [basicSsl()],
  server: {
    host: "localhost", // use ip address if running on other local devices: 192.168.1.155
    port: "8002",
    https: true,
  },
};
