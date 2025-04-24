import bcrypt from "bcryptjs";
import { db } from "../libs/db.js";
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
	const { name, email, password } = req.body;

	try {
		const existingUser = await db.user.findUnique({
			where: {
				email,
			},
		});

		if (existingUser) {
			return res.status(400).json({
				error: "User already exists!",
			});
		}

		const hashPassword = await bcrypt.hash(password, 10);

		const newUser = await db.user.create({
			data: {
				email,
				password: hashPassword,
				name,
				role: UserRole.USER,
			},
		});

		const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
			expiresIn: "7d",
		});

		res.cookie("jwt-token", token, {
			httpOnly: true,
			sameSite: "strict",
			secure: process.env.NODE_ENV !== "development",
			maxAge: 1000 * 60 * 60 * 24 * 7,
		});

		res.status(201).json({
			success: true,
			message: "User created successfully!",
			user: {
				id: newUser.Id,
				email: newUser.email,
				name: newUser.name,
				role: newUser.role,
				image: newUser.image, // to be implemented
			},
		});
	} catch (error) {
		console.error("Error creating the user: ", error);
		res.status(500).json({
			success: false,
			error: "Error creating the user",
		});
	}
};
export const login = async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await db.user.findUnique({
			where: {
				email,
			},
		});

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User not found.",
			});
		}

		const isPasswordMatch = await bcrypt.compare(password, user.password);

		if (!isPasswordMatch) {
			res.status(401).json({
				success: false,
				message: "Invalid Credentials.",
			});
		}

		const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
			expiresIn: "7d",
		});

		res.cookie("jwt-token", token, {
			httpOnly: true,
			sameSite: "strict",
			secure: process.env.NODE_ENV !== "development",
			maxAge: 1000 * 60 * 60 * 24 * 7,
		});

		res.status(200).json({
			success: true,
			message: "User Logged In successfully.",
			user: {
				id: user.Id,
				email: user.email,
				name: user.name,
				role: user.role,
				image: user.image,
			},
		});
	} catch (error) {
		console.error("Error logging in the user: ", error);
		res.status(500).json({
			success: false,
			error: "Error logging in the user",
		});
	}
};
export const logout = async (req, res) => {};
export const me = async (req, res) => {};
