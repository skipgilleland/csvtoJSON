import { Request, Response, NextFunction } from 'express';
import { checkSchema, Schema, validationResult } from 'express-validator';

type ValidationSchema = {
    [key: string]: {
        in: string[];
        [key: string]: any;
    };
};

export const validateRequest = (validationSchema: ValidationSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        await checkSchema(validationSchema).run(req);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        
        next();
    };
};