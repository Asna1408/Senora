const { validationResult, param } = require('express-validator');

const validateID = [
  param('id')
    .isMongoId() // Check if it's a valid MongoDB ObjectID
    .withMessage('Invalid ID format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('./user/pages/404');
    }
    next();
  },
];

const adminValidateID = [
  param('id')
    .custom((value) => {
      if (!isValidQueryId(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    }),
];



module.exports = {validateID,adminValidateID};