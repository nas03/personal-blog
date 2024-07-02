const createResponse = (
	isSuccess: boolean,
	data: object | {},
	code?: number,
	message?: string
) => {
	if (isSuccess) {
		return {
			status: 'success',
			code: 200,
			data,
		};
	}
	return {
		status: 'error',
		code,
		message,
	};
};
export { createResponse };
