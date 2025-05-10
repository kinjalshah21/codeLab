import { pollBatchResults, submitBatch } from "../libs/judge0.lib.js";

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

		console.log("Results got after pollBatchResults method executed: ", results);

		res.status(200).json({
			success: true,
			message: "Code executed successfully!",
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
