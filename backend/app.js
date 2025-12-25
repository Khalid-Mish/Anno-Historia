require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

var indexRouter = require('./app_server/routes/index');
var userRouter = require('./app_server/routes/user');
var timelineRouter = require('./app_server/routes/timeline');
var eventRouter = require('./app_server/routes/event');

var app = express();

// increase the server limit for request size
app.use(express.json({ limit: '100mb' }));


// view engine setup
app.set('views', path.join(__dirname, 'app_server', 'views')); 
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(cors({
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar', 'Authorization'],
}));

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); 

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/timeline', timelineRouter);
app.use('/event', eventRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

mongoose.set('strictQuery', true)
mongoose.connect(process.env.DB_URL, (err) => {
  if (err) {
    console.error('mongoose connect', err);
  }
})

module.exports = app;
