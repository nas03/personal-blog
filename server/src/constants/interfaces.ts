export type User = {
	user_id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string;
	hashed_password: string;
	is_admin: boolean;
	ts_created: Date;
	ts_registered: Date;
};
