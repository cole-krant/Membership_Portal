CREATE TABLE users(
	user_id SERIAL PRIMARY KEY,

	-- User Data --
    username VARCHAR(50) NOT NULL,
	password CHAR(60) NOT NULL,
	admin BOOLEAN NOT NULL,
	class VARCHAR(10),					-- freshman, sophomore, junior or senior
	
	-- VARCHAR 50 ALIGNMENT --
	name VARCHAR(50),
	school_email VARCHAR(50),
	personal_email VARCHAR(50),
	professional_email VARCHAR(50),
	linkedin VARCHAR(50),
	family VARCHAR(50),
	committee VARCHAR(50),				-- chapter committee
	net_group VARCHAR(50),				-- weekly networking group
	major VARCHAR(50),
	background VARCHAR(50),
	phone VARCHAR(20),

	-- INT BOOL DATA --
	domingos INT,
	brother_interviews INT,
	points INT,
	view_id INT,
	brother BOOLEAN,
	pledge BOOLEAN,
	preliminary_forms BOOLEAN,
	big_brother_mentor BOOLEAN,
	getting_to_know_you BOOLEAN,
	informational_interviews BOOLEAN,

	-- VARCHAR 40 ALIGNMENT --
	hobby1 VARCHAR(40),
	hobby2 VARCHAR(40),
	hobby3 VARCHAR(40),
	career_position VARCHAR(40),
	career_organization VARCHAR(40),
	career_duration VARCHAR(40),

	bio VARCHAR(600),
	h1_caption VARCHAR(600),
	h2_caption VARCHAR(600),
	h3_caption VARCHAR(600),

	-- Career --
	experience VARCHAR(800),
	aspirations VARCHAR(800),

	-- Preferences Aligned Data--
	likes VARCHAR(800),
	dislikes VARCHAR(800),
	quote VARCHAR(800),

	-- Favorite Brother Interview --
	fav_interview_brother VARCHAR(50),
	fav_interview_caption VARCHAR(400),

	-- LARGE DATA --
	pfp_img TEXT,						-- profile picture
	h1_img TEXT,
	h2_img TEXT,
	h3_img TEXT,

	-- GALLERY --
	g1_img TEXT,
	g2_img TEXT,
	g3_img TEXT,
	g4_img TEXT,
	g5_img TEXT,
	g6_img TEXT,

	fav_interview_img TEXT,
	resume TEXT
);

CREATE TABLE brother_interviews(
	interview_id SERIAL PRIMARY KEY,
	user_id INT NOT NULL,
	username VARCHAR(50) NOT NULL,
	brother VARCHAR(50) NOT NULL,
	family VARCHAR(20) NOT NULL,
	description VARCHAR(1200) NOT NULL,
	proof TEXT NOT NULL
);

CREATE TABLE networking_groups(
	net_id SERIAL PRIMARY KEY,
	user_id INT NOT NULL,
	username VARCHAR(50) NOT NULL,
	group_week VARCHAR(50) NOT NULL,
	description VARCHAR(1200) NOT NULL,
	proof TEXT NOT NULL
);

CREATE TABLE announcements(
	announcement_id SERIAL PRIMARY KEY,
	time DATE NOT NULL,
	username VARCHAR(50) NOT NULL,
	subject VARCHAR(200) NOT NULL,
	announcement VARCHAR(1400) NOT NULL,
	pfp_img TEXT
);

CREATE TABLE admin(
	admin_id SERIAL PRIMARY KEY,
	edit_id INT NOT NULL
);

CREATE TABLE pre_users(
	temp_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
	intent VARCHAR(400) NOT NULL,
	membership_status VARCHAR(8) NOT NULL,
	password CHAR(60) NOT NULL
);