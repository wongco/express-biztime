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
    const isPaid = (await db.query(`SELECT paid FROM invoices WHERE id=$1`, [
      req.params.id
    ])).rows[0].paid;
    console.log(isPaid, req.body.invoice.paid);

    // If you've paid, you cant pay again. If you haven't paid, or unpaid, you cant get refunded.
    if (isPaid === req.body.invoice.paid) {
      throw new APIError(
        "You've already performed that operation.  Go get more coffee.",
        403
      );
    }
    const { amt, paid } = req.body.invoice;
    let timeStamp;
    if (isPaid) {
      timeStamp = null;
    } else {
      let today = new Date();
      let date =
        today.getFullYear() +
        '-' +
        (today.getMonth() + 1) +
        '-' +
        today.getDate();
      timeStamp = date;
    }

    // sql for editing an existing company
    const result = await db.query(
      `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *`,
      [amt, !isPaid, timeStamp, req.params.id]
    );
    console.log('RESULT', result.rows);
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
