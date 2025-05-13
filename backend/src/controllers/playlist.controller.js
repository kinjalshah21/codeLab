import { db } from "../libs/db.js";

export const getAllListDetails = async (req, res) => {
	const userId = req.user.id;
	try {
		const playlists = await db.playlist.findMany({
			where: {
				userId,
			},
			include: {
				problems: {
					include: {
						problem: true,
					},
				},
			},
		});

		if (!playlists) {
			return res.status(404).json({
				success: false,
				message: "Playlists not found!",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Playlists fetched successfully!",
			playlists,
		});
	} catch (error) {
		console.log("Error in fetching playlists: ", error);
		return res.status(500).json({
			success: false,
			message: "Error in fetching playlists!",
			error: error.message,
		});
	}
};

export const getPlaylistDetailsById = async (req, res) => {
	const { playlistId } = req.params;
	const userId = req.user.id;

	try {
		const playlist = await db.playlist.finUnique({
			where: {
				id: playlistId,
				userId,
			},
			include: {
				problems: {
					include: {
						problem: true,
					},
				},
			},
		});

		if (!playlist) {
			return res.status(404).json({
				success: false,
				message: "Playlist not found!",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Playlist fetched successfully!",
			playlist,
		});
	} catch (error) {
		console.log("Error in fetching playlist: ", error);
		return res.status(500).json({
			success: false,
			message: "Error in fetching playlist!",
			error: error.message,
		});
	}
};

export const createPlaylist = async (req, res) => {
	const { name, description } = req.body;
	const userId = req.user.id;

	try {
		const playlist = await db.playlist.create({
			data: {
				name,
				description,
				userId,
			},
		});

		return res.status(200).json({
			success: true,
			message: "Playlist created successfully!",
			playlist,
		});
	} catch (error) {
		console.log("Error in creating playlist: ", error);
		return res.status(500).json({
			success: false,
			message: "Error in creating playlist!",
			error: error.message,
		});
	}
};

export const addProblemToPlaylist = async (req, res) => {
	const userId = req.user.id;
	const { playlistId } = req.params;
	const { problemIds } = req.body;

	try {
		if (!Array.isArray(problemIds) || problemIds.length === 0) {
			return res.status(404).json({
				success: false,
				message: "Invalid or missing problemIds!",
			});
		}

		const problemInPlaylist = await db.problemInPlaylist.createMany({
			data: problemIds.map((problemId) => ({
				playlistId,
				problemId,
			})),
		});

		return res.status(201).json({
			success: true,
			message: "Problems added successfully in the playlist!",
			problemInPlaylist,
		});
	} catch (error) {
		console.log("Error in adding problems in playlist: ", error);
		return res.status(500).json({
			success: false,
			message: "Error in adding problems in playlist!",
			error: error.message,
		});
	}
};

export const deletePlaylist = async (req, res) => {
	const { playlistId } = req.params;

	try {
		const deletedPlaylist = await db.playlist.delete({
			where: {
				id: playlistId,
			},
		});

		return res.status(200).json({
			success: true,
			message: "Playlist deleted successfully!",
			deletedPlaylist,
		});
	} catch (error) {
		console.log("Error in deleting playlist: ", error);
		return res.status(500).json({
			success: false,
			message: "Error in deleting playlist!",
			error: error.message,
		});
	}
};

export const removeProblemFromPlaylist = async (req, res) => {
	const { problemIds } = req.body;
	const { playlistId } = req.params;

	try {
		if (!Array.isArray(problemIds) || problemIds.length === 0) {
			return res.status(404).json({
				success: false,
				message: "Invalid or missing problemIds!",
			});
		}

		const deleteProblem = await db.problemInPlaylist.deleteMany({
			where: {
				playlistId,
				problemId: {
					in: problemIds,
				},
			},
		});

		return res.status(200).json({
			success: true,
			message: "Problems deleted successfully!",
			deleteProblem,
		});
	} catch (error) {
		console.log("Error in deleting problems from the playlist: ", error);
		return res.status(500).json({
			success: false,
			message: "Error in deleting problems from the playlist!",
			error: error.message,
		});
	}
};
