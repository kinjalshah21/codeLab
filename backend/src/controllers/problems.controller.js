import { UserRole } from "../generated/prisma/index.js";
import { db } from "../libs/db.js";
import {
	getJudge0LanguageId,
	pollBatchResults,
	submitBatch,
} from "../libs/judge0.lib.js";

export const createProblem = async (req, res) => {
	// get required data from request body
	const {
		title,
		description,
		difficulty,
		tags,
		examples,
		constraints,
		testcases,
		codeSnippets,
		referenceSolution,
	} = req.body;

	// check user role once again
	if (req.user.role !== UserRole.ADMIN) {
		return res.status(403).json({
			success: false,
			message: "You are not allowed to create problem.",
		});
	}

	// loop through each reference solution for different language.
	try {
		for (const [language, solutionCode] of Object.entries(
			referenceSolution
		)) {
			const languageId = getJudge0LanguageId(language);

			if (!languageId) {
				return res.status(400).json({
					success: false,
					error: `Language ${language} not supported!`,
				});
			}

			const submissions = testcases.map(({ input, output }) => ({
				source_code: solutionCode,
				language_id: languageId,
				stdin: input,
				expected_output: output,
			}));

			const submissionResults = await submitBatch(submissions);

			const tokens = submissionResults.map((res) => res.token);

			const results = await pollBatchResults(tokens);

			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				console.log("Result after polling :: ", result);

				if (result.status.id !== 3) {
					return res.status(400).json({
						success: false,
						error: `Testcase ${
							i + 1
						} failed for language ${language}`,
					});
				}
			}
		}

		//after running test classes for every language save the problem to db
		//save the problem to the database

		const newProblem = await db.problem.create({
			data: {
				title,
				description,
				difficulty,
				tags,
				examples,
				constraints,
				testcases,
				codeSnippets,
				referenceSolution,
				userId: req.user.id,
			},
		});

		return res.status(201).json({
			success: true,
			message: "Problem created successfully",
			problem: newProblem,
		});
	} catch (error) {
		console.error("Error creating the problem.");
		res.status(500).json({
			success: false,
			message: "Error occurred while creating the problem.",
			error: error.message,
		});
	}
};

export const getAllProblems = async (req, res) => {
	try {
		const problems = await db.problem.findMany();

		if (!problems) {
			return res.status(404).json({
				success: false,
				message: "No problems found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Problems fetched successfully!",
			problems,
		});
	} catch (error) {
		console.error("Error fetching the problems.");
		res.status(500).json({
			success: false,
			message: "Error occurred while fetching problems.",
			error: error.message,
		});
	}
};

export const getProblemById = async (req, res) => {
	const { id } = req.params;

	try {
		const problem = await db.problem.findUnique({
			where: {
				id,
			},
		});

		if (!problem) {
			return res.status(404).json({
				success: false,
				message: "No problem found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Problem fetched successfully!",
			problem,
		});
	} catch (error) {
		console.error("Error fetching the problem.");
		res.status(500).json({
			success: false,
			message: "Error occurred while fetching problem.",
			error: error.message,
		});
	}
};

export const updateProblem = async (req, res) => {
	const { id } = req.params;

	const {
		title,
		description,
		difficulty,
		tags,
		examples,
		constraints,
		testcases,
		codeSnippets,
		referenceSolution,
	} = req.body;

	// check user role once again
	if (req.user.role !== UserRole.ADMIN) {
		return res.status(403).json({
			success: false,
			message: "Only Admins are allowed to update the problem.",
		});
	}

	try {
		for (const [language, solutionCode] of Object.entries(
			referenceSolution
		)) {
			const languageId = getJudge0LanguageId(language);

			if (!languageId) {
				return res.status(400).json({
					success: false,
					error: `Language ${language} not supported!`,
				});
			}

			const submissions = testcases.map(({ input, output }) => ({
				source_code: solutionCode,
				language_id: languageId,
				stdin: input,
				expected_output: output,
			}));

			const submissionResults = await submitBatch(submissions);

			const tokens = submissionResults.map((res) => res.token);

			const results = await pollBatchResults(tokens);

			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				console.log(
					"Result after polling for each testcase:: ",
					result
				);

				if (result.status.id !== 3) {
					return res.status(400).json({
						success: false,
						error: `Testcase ${
							i + 1
						} failed for language ${language}`,
					});
				}
			}
		}

		//update the problem once all the testcases are passed for the all the supported languages
		const updatedProblem = await db.problem.update({
			where: {
				id,
			},
			data: {
				title,
				description,
				difficulty,
				tags,
				examples,
				constraints,
				testcases,
				codeSnippets,
				referenceSolution,
				userId: req.user.id,
			},
		});

		return res.status(200).json({
			success: true,
			message: "Problem updated successfully",
			problem: updatedProblem,
		});
	} catch (error) {
		console.error("Error updating the problem.");
		res.status(500).json({
			success: false,
			message: "Error occurred while updating the problem.",
			error: error.message,
		});
	}
};

export const deleteProblem = async (req, res) => {
	const { id } = req.params;

	if (req.user.role !== UserRole.ADMIN) {
		return res.status(403).json({
			success: false,
			message: "Only Admins are allowed to delete the problem.",
		});
	}

	try {
		const problem = await db.problem.findUnique({
			where: {
				id,
			},
		});

		if (!problem) {
			return res.status(404).json({
				success: false,
				message: "Problem not found - cannot delete the problem.",
			});
		}

		await db.problem.delete({
			where: {
				id,
			},
		});

		return res.status(200).json({
			success: true,
			message: "Problem deleted successfully!",
		});
		
	} catch (error) {
		console.error("Error deleting the problem.");
		res.status(500).json({
			success: false,
			message: "Error occurred while deleting the problem.",
			error: error.message,
		});
	}
};

export const getAllProblemsSolvedByUser = async (req, res) => {
	const userId = req.user.id;
	try {
		const problems = await db.problem.findMany({
			where: {
				solvedBy: {
					some: {
						userId
					},
				},
			},
			include: {
				solvedBy: {
					where: {
						userId
					}
				}
			},
		});

		return res.status(200).json({
			success: true,
			message: "Problems fetched successfully!",
			problems,
		});
		  
	} catch (error) {
		console.error("Error fetching the problem.");
		res.status(500).json({
			success: false,
			message: "Error occurred while fetching the problem.",
			error: error.message,
		});
	}
};
