CREATE TABLE IF NOT EXISTS `sfc_question_m` (
	`id` integer PRIMARY KEY NOT NULL,
	`year` text NOT NULL,
	`answerNo` text NOT NULL,
	`questionNo` text NOT NULL,
	`enLink` text,
	`tcLink` text
);