const express = require('express');
const router = new express.Router();
const APIError = require('../error');
const db = require('../db');

/** default relative router for companies */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM companies`);
    return res.json({
      companies: result.rows
    });
  } catch (error) {
    return next(error);
  }
});

/** give us a specific company's info */
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;

    const companyResult = await db.query(
      `SELECT * FROM companies WHERE code = $1`,
      [code]
    );

    const invoiceResult = await db.query(
      `SELECT * FROM invoices WHERE comp_code = $1`,
      [code]
    );

    if (companyResult.rows.length === 0) {
      throw new APIError("Can't find yo stuff. Sorry. not sorry.", 404);
    }

    companyResult.rows[0].invoices = invoiceResult.rows;

    return res.json({
      company: companyResult.rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

/** deleting an existing company */
router.delete('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      'DELETE FROM companies WHERE code=$1 RETURNING *',
      [code]
    );

    // handles stuff when we can't find a company to edit
    if (result.rows.length === 0) {
      throw new APIError(
        "Can't find your company to delete. Please check your company code",
        404
      );
    }

    return res.json({
      message: 'Successfully deleted your company.',
      company: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

/** Error handling for validating company key, nested name and decs inputs */
router.use((req, res, next) => {
  try {
    const { company } = req.body;
    if (!company) {
      throw new APIError(
        'Hey! Check your nested inputs! (company key not found)',
        404
      );
    }

    const { name, description } = company;
    if (!name || !description) {
      throw new APIError(
        'Hey! Check your nested inputs! (name or description incorrect)',
        404
      );
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

/** handle adding a company */
router.post('/', async (req, res, next) => {
  try {
    const { code, name, description } = req.body.company;

    const result = await db.query(
      `INSERT INTO companies (code, name, description) VALUES($1, $2, $3) RETURNING *`,
      [code, name, description]
    );
    return res.json({
      company: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

/** edit a existing company */
router.put('/:code', async (req, res, next) => {
  try {
    let { code } = req.body.company;
    if (code) {
      throw new APIError(
        "Hey! Don't try to send us an updated comp code. Don't do it!@@@@@@@@@",
        404
      );
    }

    code = req.params.code;
    const { name, description } = req.body.company;

    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *`,
      [name, description, code]
    );

    if (result.rows.length === 0) {
      throw new APIError(
        "Can't find your company to delete. Please check your company code",
        404
      );
    }

    return res.json({
      company: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

// exports router for app.js use
module.exports = router;
