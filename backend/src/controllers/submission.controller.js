import { db } from "../libs/db.js";

export const getAllSubmission = async (req, res) => {
	const userId = req.user.id;

	try {
		const submissions = await db.submission.findMany({
			where: {
				userId,
			},
		});

		res.status(200).json({
			success: true,
			message: "Submissions fetched successfully!",
			submissions,
		});
	} catch (error) {
		console.error("Error in getting all the submissions ", error);
		res.status(500).json({
			success: false,
			message: "Error in fetching submissions!",
			error: error.message,
		});
	}
};
export const getSubmissionsForProblem = async (req, res) => {
	const userId = req.user.id;
	const problemId = req.params.problemId;

	try {
		const submissions = await db.submission.findMany({
			where: {
				userId,
				problemId,
			},
		});

		res.status(200).json({
			success: true,
			message: "Submissions fetched successfully!",
			submissions,
		});
	} catch (error) {
		console.error("Error in getting all the submissions ", error);
		res.status(500).json({
			success: false,
			message: "Error in fetching submissions!",
			error: error.message,
		});
	}
};
export const getSubmissionCountForProblem = async (req, res) => {
	const problemId = req.params.problemId;

	try {
		const submission = await db.submission.count({
			where: {
				problemId,
			},
		});

		res.status(200).json({
			success: true,
			message: "Submissions count successfully!",
			count: submission,
		});
	} catch (error) {
		console.error("Error in getting count of the submissions ", error);
		res.status(500).json({
			success: false,
			message: "Error in fetching submission count!",
			error: error.message,
		});
	}
};
