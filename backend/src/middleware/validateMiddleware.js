const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err.errors) {
        return res.status(400).json({
          errorCode: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
};

module.exports = {
  validate,
};
