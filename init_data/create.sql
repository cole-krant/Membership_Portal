CREATE TABLE users(
	user_id SERIAL PRIMARY KEY,

	-- User Data --
    username VARCHAR(50) NOT NULL,
	password CHAR(60) NOT NULL,
	name VARCHAR(50),
	admin BOOLEAN,
	class VARCHAR(10),					-- freshman, sophomore, junior or senior
	major VARCHAR(50),					-- major
	committee VARCHAR(50),				-- chapter committee
	net_group VARCHAR(50),				-- weekly networking group
	
	bio VARCHAR(120),
	email VARCHAR(50),
	linkedin VARCHAR(50),
	spotify VARCHAR(50),
	phone VARCHAR(20),

	-- Assignments --
	preliminary_forms BOOLEAN,
	big_brother_mentor BOOLEAN,
	getting_to_know_you BOOLEAN,
	informational_interviews BOOLEAN,

	-- Statistics --
	domingos INT,
	brother_interviews INT,
	points INT NOT NULL,

	-- Hobbies --
	hobby1 VARCHAR(20),
	hobby2 VARCHAR(20),
	hobby3 VARCHAR(20),
	h1_caption VARCHAR(20),
	h2_caption VARCHAR(20),
	h3_caption VARCHAR(20),

	background VARCHAR(50),

	-- LARGE DATA --
	pfp_img TEXT,						-- profile picture
	h1_img TEXT,
	h2_img TEXT,
	h3_img TEXT,
	resume TEXT
);

CREATE TABLE brother_interviews(
	interview_id SERIAL PRIMARY KEY,
	username VARCHAR(50) NOT NULL,
	brother VARCHAR(50) NOT NULL,
	family VARCHAR(20) NOT NULL,
	proof TEXT NOT NULL
);

CREATE TABLE networking_groups(
	net_id SERIAL PRIMARY KEY,
	username VARCHAR(50) NOT NULL,
	group_week VARCHAR(50) NOT NULL,
	proof TEXT NOT NULL
);

CREATE TABLE announcements(
	announcement_id SERIAL PRIMARY KEY,
	time DATE NOT NULL,
	username VARCHAR(50) NOT NULL,
	subject VARCHAR(50) NOT NULL,
	announcement VARCHAR(800) NOT NULL,
	pfp_img TEXT
);

CREATE TABLE admin(
	admin_id SERIAL PRIMARY KEY,
	edit_id INT NOT NULL
);