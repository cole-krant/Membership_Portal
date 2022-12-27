CREATE TABLE users(
	user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
	password CHAR(60) NOT NULL,
	admin INT,
	img VARCHAR(300),					-- profile picture
	class VARCHAR(50),					-- freshman, sophomore, junior or senior
	major VARCHAR(50),					-- major
	committee VARCHAR(50),				-- chapter committee
	net_group VARCHAR(50),				-- weekly networking group
	brother_interviews INT              -- number of completed brother interviews
);

-- CREATE TABLE user_to_data(
-- 	user_id SERIAL FOREIGN KEY,
-- 	user_data_id SERIAL FOREIGN KEY
-- );

-- CREATE TABLE user_data(
-- 	user_data_id SERIAL PRIMARY KEY,
--     username VARCHAR(50) NOT NULL,
-- 	admin INT,
-- 	img BYTEA,							-- profile picture
-- 	class VARCHAR(4),					-- freshman, sophomore, junior or senior
-- 	major VARCHAR(50),					-- major
-- 	committee VARCHAR(50),				-- chapter committee
-- 	net_group VARCHAR(50),				-- weekly networking group
-- 	brother_interviews INT              -- number of completed brother interviews
-- );