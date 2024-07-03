import fs from 'fs';
import path from 'path';

// Directory containing the SQL files
const SQL_DIR = 'sql';

// Output file
const OUTPUT_FILE = 'sql/index.sql';

// Ensure the output file is empty
fs.writeFileSync(OUTPUT_FILE, '');

// Read all files in the directory
fs.readdir(SQL_DIR, (err, files) => {
	if (err) {
		console.error('Error reading directory:', err);
		return;
	}

	// Filter for .sql files
	const sqlFiles = [
		'user.sql',
		'category.sql',
		'post.sql',
		'post_category.sql',
		'post_comment.sql',
		'user_access_history.sql',
		'user_refresh_token.sql',
	];

	sqlFiles.forEach((file) => {
		const filePath = path.join(SQL_DIR, file);
		const fileContent = fs.readFileSync(filePath, 'utf-8');

		// Append file content to the output file
		fs.appendFileSync(OUTPUT_FILE, `-- Merging file: ${file}\n`);
		fs.appendFileSync(OUTPUT_FILE, fileContent);
		fs.appendFileSync(OUTPUT_FILE, '\n\n');
	});

	console.log('All SQL files have been merged into', OUTPUT_FILE);
});
