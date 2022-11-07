var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var hbs = require("express-handlebars")

var app = express();
var fileUpload = require("express-fileupload")
var db = require("./config/connection")
var session= require('express-session')
let nocache = require('node-nocache');
let flash = require("connect-flash")
//otp generator
const otpGenerator = require('otp-generator')
// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({helpers:{inc:function(value,options){return parseInt(value)+1;},
                              multiply: (num1, num2) => num1 * num2,
                              sum: (num1, num2) => num1 + num2,},extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/admin/layout/',partialsDir:__dirname+'/views/admin/partials/'}))
//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({secret:"Key",cookie:{maxAge:6000000}}))

db.connect((err)=>{
  if(err)
  console.log("dconnection error"+err);
  else
  console.log("Database connected to port  ");
})
app.use(nocache);

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
