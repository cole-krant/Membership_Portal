CREATE TABLE users(
	user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
	password CHAR(60) NOT NULL,
	img BYTEA,							-- profile picture
	class VARCHAR(4),					-- freshman, sophomore, junior or senior
	major VARCHAR(50),					-- major
	committee VARCHAR(50),				-- chapter committee
	net_group VARCHAR(50),				-- weekly networking group
	brother_interviews INT              -- number of completed brother interviews
);