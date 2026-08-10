'use strict';

/**
 * Zod validation middleware factory.
 *
 * Usage:
 *   router.post('/route', validate(MySchema), handler)
 *   router.get('/route', validate(MySchema, 'query'), handler)
 *   router.get('/:id',   validate(MySchema, 'params'), handler)
 *
 * On success  → the parsed/coerced data is written back to the request and next() is called.
 * On failure  → 400 JSON { error, fields, form? }
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const flat = result.error.flatten();
      return res.status(400).json({
        error:  'Datos inválidos',
        fields: flat.fieldErrors,
        ...(flat.formErrors.length ? { form: flat.formErrors } : {}),
      });
    }
    // Express 5 exposes req.query through a read-only getter. Mutate the
    // existing object instead of assigning req.query, which works in Express 4
    // but throws in Express 5.
    if (target === 'query') {
      Object.keys(req.query).forEach(key => delete req.query[key]);
      Object.assign(req.query, result.data);
    } else if (target === 'params') {
      Object.assign(req.params, result.data);
    } else {
      req[target] = result.data;
    }
    next();
  };
}

module.exports = { validate };
