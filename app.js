/** BizTime express application. */

const express = require('express');
const morgan = require('morgan');
const app = express();
const companiesRoutes = require('./routes/companies');

// let express recognize json stuff
app.use(express.json());

// let express parse body stuff
app.use(express.urlencoded({ extended: true }));

// morgan will run before every request
app.use(morgan('tiny'));

// express router - routing for companies base url
app.use('/companies', companiesRoutes);

/** 404 handler */
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});

module.exports = app;
