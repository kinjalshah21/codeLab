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
			success: true,
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

				if (result.status.id !== 3) {
					return res.status(400).json({
						success: false,
						error: `Testcase ${
							i + 1
						} failed for language ${language}`,
					});
				}
			}

			//save the problem to the database

			const newProblem = await db.problem.create({
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
			});

      return res.status(201).json(newProblem);
		}
	} catch (error) {}
};

export const getAllProblems = async (req, res) => {};

export const getProblemById = async (req, res) => {};

export const updateProblem = async (req, res) => {};

export const deleteProblem = async (req, res) => {};

export const getAllProblemsSolvedByUser = async (req, res) => {};
