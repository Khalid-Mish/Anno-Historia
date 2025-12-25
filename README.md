## Summary:
Anno-Historia is my latest project aimed at building a digital humanities web-based software to aid in history research.

This project has made a first attempt to create a tool which bridges the gap between the traditional
method of entering historical data and key information into a database and having an analytics
feature which gives the users a flexible method of measuring and producing simple numerical
information about their historical data. The goal was to produce a software which compliments
traditional historical research by producing new insights not normally possible with only traditional
historical research methods.

Specifically, this software allows users to create timelines. Timelines can be created manually or by importing data which will then be formatted to fit into the timelines.
The user then has a large variety of filtering and search options as well as a portal to see automatically generated analytical data for each of their timelines.

Anno-Historia's front end was developed in **REACT.js** with the backend being developed in **Node.js**. Furthermore, **MongoDB** was utilised as a backend database for this project
in order to store user credentials as well as information about their timelines.

## How to run

The project consists of two folders: the Historia-Frontend folder, and the Historia-Backend folder.

### Backend Setup:

The backend database runs on MongoDB. For security reasons I have <b>not</b> included the database secrets here and this must be done manually in the .env folder if you would like to utilise the backend database.

1. Navigate to the `Historia-Backend` folder.
2. Run `npm i nodemon` to install dependencies.
3. Copy `.env.example` to `.env`: `cp .env.example .env`
4. Fill in the required values in `.env`:
   - `JWT_SECRET`: Generate a random secret (e.g., using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `DB_URL`: Your MongoDB connection string
   - `WEBSITE_URL`: Usually `http://localhost:3001` for development
   - `email` and `password`: Your email credentials (use app password for Gmail)
5. Run `npm start` to start the backend server.

### Frontend Setup:
1. Navigate to the `Historia-Frontend` folder.
2. Run `npm i nodemon` to install dependencies.
3. Run `npm start` to start the frontend development server.

## Video Demo:

https://www.youtube.com/watch?v=-GNIt_o25r4&t=6s

[![Anno-Historia Logo](ah_logo.png)](https://www.youtube.com/watch?v=-GNIt_o25r4&t=6s)


