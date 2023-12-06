const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Replace with your MongoDB connection string
const DB_URL = "mongodb://127.0.0.1:27017/chess";

mongoose.connect(DB_URL, {
 useNewUrlParser: true,
 useUnifiedTopology: true,
})

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Define the User schema and model
const UserSchema = new mongoose.Schema({
 username: String,
 password: String,
});

const User = mongoose.model('User', UserSchema);

module.exports = {
   User,
 };