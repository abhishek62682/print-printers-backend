import { z } from "zod";
import createHttpError from "http-errors";

export const validate = (schema) => {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body:   req.body,
      params: req.params,
      query:  req.query,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten();

      const fieldErrors = {
        ...flattened.fieldErrors,
        ...(parsed.error.formErrors?.fieldErrors ?? {}),
      };

      const errors = Object.entries(fieldErrors).map(([field, messages]) => ({
        field,
        message: messages?.[0] ?? "Invalid value",
      }));

      const message =
        errors[0]?.message ??
        parsed.error.issues?.[0]?.message ??
        "Validation failed";

      return next(
        Object.assign(createHttpError(422, message), { errors })
      );
    }

    // ✅ attach validated data directly back onto req
    if (parsed.data.body)   req.body   = parsed.data.body;
    if (parsed.data.params) Object.assign(req.params, parsed.data.params);
    if (parsed.data.query)  Object.assign(req.query,  parsed.data.query);

    next();
  };
};

export default validate;