const express = require('express');
const router = new express.Router();

const db = require('../db');

/** default relative router for companies */
router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({
      companies: results.rows
    });
  } catch (err) {
    return next(err);
  }
});

/** give us a specific company's info */
router.get('/:code', async (req, res, next) => {
  try {
    const company_result = await db.query(
      `SELECT * FROM companies WHERE code = $1`,
      [req.params.code]
    );

    const invoice_result = await db.query(
      `SELECT * FROM invoices WHERE comp_code = $1`,
      [req.params.code]
    );

    if (company_result.rows.length === 0) {
      // no company_result - throw 404
      const error = new Error("Can't find yo stuff. Sorry. not sorry.");
      error.status = 404;
      return next(error);
    }

    company_result.rows[0].invoices = invoice_result.rows;

    // if good do this json stuff
    return res.json({
      company: company_result.rows[0]
    });
  } catch (err) {
    return next(err);
  }
});

/** deleting an existing company */
router.delete('/:code', async (req, res, next) => {
  try {
    const code = req.params.code;
    // sql for editing an existing company
    const result = await db.query(
      'DELETE FROM companies WHERE code=$1 RETURNING *',
      [code]
    );

    // handles stuff when we can't find a company to edit
    if (result.rows.length === 0) {
      const error = new Error(
        "Can't find your teapot to delete #*$&#($&#@ try again. Even a broken clock is right twice a day."
      );
      error.status = 418;
      return next(error);
    }

    // good stuff happens here
    return res.json({
      message: 'Successfully deleted your company.',
      company: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/** Error handling for validating company name and decs inputs */
router.use((req, res, next) => {
  if (!req.body.company.name || !req.body.company.description) {
    const error = new Error(
      'Hey! Send us proper stuff man. come on. (check your inputs)'
    );
    error.status = 404;
    return next(error);
  }
});

/** handle adding a company */
router.post('/', async (req, res, next) => {
  try {
    // do sql query for inserting stuff - sanatize
    const name = req.body.comapny.name;
    const code = req.body.company.code;
    const description = req.body.company.description;

    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES($1, $2, $3) RETURNING *`,
      [code, name, description]
    );
    // if good do this json stuff
    return res.json({
      company: results.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/** edit a existing company */
router.put('/:code', async (req, res, next) => {
  try {
    // if code exists, throw error. don't provide code plz
    if (req.body.company.code) {
      // no results - throw 404
      const error = new Error(
        "Hey! Don't try to send us an updated comp code. Don't do it!@@@@@@@@@"
      );
      error.status = 404;
      return next(error);
    }

    // do sql query for inserting stuff - sanatize
    const code = req.params.code;
    const name = req.body.company.name;
    const description = req.body.company.description;

    // sql for editing an existing company
    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *`,
      [name, description, code]
    );

    // handles stuff when we can't find a company to edit
    if (result.rows.length === 0) {
      const error = new Error(
        "Can't find yo company to edit #*$&#($&#@ try again. Even a broken clock is right twice a day."
      );
      error.status = 404;
      return next(error);
    }

    return res.json({
      company: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// exports router for app.js use
module.exports = router;
