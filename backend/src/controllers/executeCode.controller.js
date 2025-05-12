import { db } from "../libs/db.js";
import {
	getLanguageName,
	pollBatchResults,
	submitBatch,
} from "../libs/judge0.lib.js";

export const executeCode = async (req, res) => {
	const { source_code, language_id, stdin, expected_outputs, problemId } =
		req.body;

	const userId = req.user.id;

	try {
		//Validate test cases
		if (
			!Array.isArray(stdin) ||
			stdin.length == 0 ||
			!Array.isArray(expected_outputs) ||
			expected_outputs.length !== stdin.length
		) {
			return res.status(400).json({
				success: false,
				message: "Invalid or missing test cases.",
			});
		}

		//Prepare each test case for judge0 batch submission
		const submissions = stdin.map((input) => ({
			source_code,
			language_id,
			stdin: input,
		}));

		//submit the submissions and get response
		const submitResponse = await submitBatch(submissions);

		const tokens = submitResponse.map((res) => res.token);

		const results = await pollBatchResults(tokens);

		console.log(
			"Results got after pollBatchResults method executed: ",
			results
		);

		//Analyze test case results
		let allPassed = true;

		const detailedResults = results.map((result, i) => {
			const stdout = result.stdout?.trim();
			const expected_output = expected_outputs[i]?.trim();
			const passed = stdout === expected_output;

			if (!passed) allPassed = false;

			return {
				testCase: i + 1,
				passed,
				stdout,
				expectedOutput: expected_output,
				stderr: result.stderr || null,
				compileOutput: result.compile_output || null,
				status: result.status.description,
				memory: result.memory ? `${result.memory} KB` : undefined,
				time: result.time ? `${result.time} s` : undefined,
			};
		});

		console.log("detailedResults ::", detailedResults);
		const language = await getLanguageName(language_id);

		//store submission
		const submission = await db.submission.create({
			data: {
				userId,
				problemId,
				sourceCode: source_code,
				language,
				stdin: stdin.join("\n"),
				stdout: JSON.stringify(
					detailedResults.map((result) => result.stdout)
				),
				stderr: detailedResults.some((r) => r.stderr)
					? JSON.stringify(detailedResults.map((r) => r.stderr))
					: null,
				compileOutput: detailedResults.some((r) => r.compile_output)
					? JSON.stringify(
							detailedResults.map((r) => r.compile_output)
					  )
					: null,
				status: allPassed ? "Accepted" : "Wrong Answer",
				memory: detailedResults.some((r) => r.memory)
					? JSON.stringify(detailedResults.map((r) => r.memory))
					: null,
				time: detailedResults.some((r) => r.time)
					? JSON.stringify(detailedResults.map((r) => r.time))
					: null,
			},
		});

		//If allPassed = true, then mark the problem as done for the user.
		if (!allPassed) {
			await db.problemSolved.upsert({
				where: {
					userId_problemId: {
						userId,
						problemId,
					},
				},
				update: {},
				create: {
					userId,
					problemId,
				},
			});
		}

		//store individual TestCaseResult
		const testCaseResults = detailedResults.map((result) => ({
			problemId,
			submissionId: submission.id,
			testCase: result.testCase,
			passed: result.passed,
			stdout: result.stdout,
			expectedOutput: result.expectedOutput,
			stderr: result.stderr,
			compileOutput: result.compileOutput,
			status: result.status,
			memory: result.memory,
			time: result.time,
		}));

		await db.testCaseResult.createMany({
			data: testCaseResults,
		});

		//Get submission and related testcase data to send with the response
		const submissionWithTestCases = await db.submission.findUnique({
			where: {
				id: submission.id,
			},
			include: {
				testcases: true,
			},
		});

		res.status(200).json({
			success: true,
			message: "Code executed successfully!",
			submission: submissionWithTestCases,
		});
	} catch (error) {
		console.error("Error in executing code ", error);
		res.status(500).json({
			success: false,
			message: "Error in code execution!",
			error: error.message,
		});
	}
};
