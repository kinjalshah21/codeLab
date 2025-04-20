import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

app.use(express.json());


app.use("/api/v1/auth", authRoutes);
app.get("/", (req, res) => {
	res.send("Hello everyone! Welcome to CodeLab.🤩");
});

app.listen(process.env.PORT, () => {
	console.log(`Server is running at PORT: ${process.env.PORT}`);
});
