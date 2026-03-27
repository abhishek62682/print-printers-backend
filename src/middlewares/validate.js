import createHttpError from "http-errors";

const validate = (schema) => {
  return (req, res, next) => {
    const fieldErrors = {};
    let firstMessage = null;

    const segments = ["body", "params", "query"];

    for (const seg of segments) {
      if (!schema.shape?.[seg]) continue;

      const result = schema.shape[seg].safeParse(req[seg]);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const key = issue.path.join(".") || seg;
          if (!fieldErrors[key]) fieldErrors[key] = [];
          fieldErrors[key].push({ message: issue.message, type: issue.code });
          if (!firstMessage) firstMessage = issue.message;
        });
      } else {
        if (seg === "body")   req.body   = result.data;
        if (seg === "params") Object.assign(req.params, result.data);
        if (seg === "query")  Object.assign(req.query,  result.data);
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      const error = createHttpError(422, firstMessage || "Validation failed");
      error.fieldErrors = fieldErrors;
      error.statusCode  = 422;
      return next(error);
    }

    next();
  };
};

export default validate;