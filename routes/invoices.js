const express = require('express');
const router = new express.Router();
const APIError = require('../error');
const db = require('../db');

router.get('/', async function(req, res, next) {
  try {
    const results = await db.query(`SELECT id, comp_code FROM invoices`);
    return res.json({
      invoices: results.rows
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async function(req, res, next) {
  try {
    const result = await db.query(
      `SELECT * FROM invoices JOIN companies ON companies.code = invoices.comp_code WHERE $1=invoices.id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new APIError('No invoice', 404);
    }

    const { comp_code, ...invoice } = result.rows[0];
    const { code, name, description } = invoice;
    const company = { code, name, description };

    return res.json({
      invoice: {
        ...invoice,
        company
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function(req, res, next) {
  try {
    const { comp_code, amt } = req.body.invoice;
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES($1, $2) RETURNING *`,
      [comp_code, amt]
    );

    return res.json({
      invoice: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    // do sql query for inserting stuff - sanatize

    const { amt } = req.body.invoice;

    // sql for editing an existing company
    const result = await db.query(
      `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *`,
      [amt, req.params.id]
    );
    if (result.rows.length === 0) {
      throw new APIError('No invoice', 404);
    }

    return res.json({
      invoice: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // sql for editing an existing company
    const result = await db.query(
      'DELETE FROM invoices WHERE id=$1 RETURNING *',
      [id]
    );

    // handles stuff when we can't find a company to edit
    if (result.rows.length === 0) {
      throw new APIError('No invoice', 404);
    }

    // good stuff happens here
    return res.json({
      message: 'Successfully deleted your invoice.',
      invoice: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
