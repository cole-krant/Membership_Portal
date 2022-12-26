CREATE TABLE users(
	user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
	password CHAR(60) NOT NULL
);