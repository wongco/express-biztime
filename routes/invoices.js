const express = require('express');
const router = new express.Router();
const APIError = require('../error');
const db = require('../db');

/** default relative router for all invoices */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT id, comp_code FROM invoices`);
    return res.json({
      invoices: result.rows
    });
  } catch (error) {
    return next(error);
  }
});

/** route for adding a new invoice */
router.post('/', async (req, res, next) => {
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

/** route for specific invoice detail */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM invoices JOIN companies ON companies.code = invoices.comp_code WHERE $1=invoices.id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new APIError('Specified invoice does not exist.', 404);
    }

    // destructure result into desired format for JSON
    const { comp_code, ...invoice } = result.rows[0];
    const { code, name, description } = invoice;
    const company = { code, name, description };

    return res.json({
      invoice: {
        ...invoice,
        company
      }
    });
  } catch (error) {
    return next(error);
  }
});

/** route for modifiying specific invoice */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // check if status of targetd invoice is paid or unpaid
    const isPaid = (await db.query(`SELECT paid FROM invoices WHERE id=$1`, [
      id
    ])).rows[0].paid;

    const { amt, paid } = req.body.invoice;

    // If you've paid, you cant pay again. If you haven't paid, or unpaid, you cant get refunded.
    if (isPaid === paid) {
      throw new APIError(
        "You've already performed that operation.  Go get more coffee.",
        403
      );
    }

    // if isPaid is true, set time stamp to null, otherwise set to current time
    const timeStamp = isPaid ? null : new Date();

    const result = await db.query(
      `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *`,
      [amt, !isPaid, timeStamp, id]
    );

    if (result.rows.length === 0) {
      throw new APIError('Specified invoice does not exist.', 404);
    }

    return res.json({
      invoice: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/** route for deleting a specific invoice */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // sql for editing an existing company
    const result = await db.query(
      'DELETE FROM invoices WHERE id=$1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      throw new APIError('Specified invoice does not exist.', 404);
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
