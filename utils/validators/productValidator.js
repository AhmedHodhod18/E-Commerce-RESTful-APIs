const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware')
const Category = require('../../models/categoryModel');
const SubCategory = require('../../models/subCategoriesModel');

exports.createProductValidator = [
    check('title').isLength({ min: 3 }).withMessage('must be at least 3 chars').notEmpty().withMessage('Product required')
    .custom((val, { req }) => {
        req.body.slug = slugify(val);
        return true;
    }),
    check('description').notEmpty().withMessage('Product description is required').isLength({max: 2000}).withMessage('Too long description'),
    check('quantity').notEmpty().withMessage('Product quantity is required').isNumeric().withMessage('Product quantity must be a number'),
    check('sold').optional().isNumeric().withMessage('Sold must be a number'),
    check('price').notEmpty().withMessage('Product price is required').isNumeric().withMessage('Product price must be a number').isLength({max: 32}).withMessage('Too long price'),
    check('priceAfterDiscount').optional().isNumeric().withMessage('Product price after discount must be a number').toFloat()
    .custom((value, {req}) => {
            if (req.body.price <= value) {
                throw new Error('Product price after discount must be lower than price')
            }
            return true;
        }),
    check('colors').optional().isArray().withMessage('availableColors should be array of string'),
    check('coverImage').notEmpty().withMessage('Product cover images is required'),
    check('images').optional().isArray().withMessage('coverImages should be array of string'),
    check('category').notEmpty().withMessage('Product must be belong to a category').isMongoId().withMessage('Invalid ID format')
    .custom((categoryId) => Category.findById(categoryId)
    .then(category => {
        if (!category) {
            return Promise.reject(
                new Error(`No category for this Id ${categoryId}`)
            )
        }
    })
),
    check('subcategories').optional().isMongoId().withMessage('Invalis ID format')
    .custom((subcategoriesIds) => 
        SubCategory.find({ _id: { $exists: true, $in: subcategoriesIds} }).then((result) => { 
                if (result < 1 || result.length !== subcategoriesIds.length) {
                    return Promise.reject(
                        new Error(`Invalid subCategories Ids ${subcategoriesIds}`)
                    )}
                }))
    .custom((val, {req}) => SubCategory.find({category: req.body.category})
    .then((subcategories) => {
        const subCategoriesIdsInDB = [];
        subcategories.forEach((subCategory) => {
            subCategoriesIdsInDB.push(subCategory._id.toString());
        })
        // check if subcategories ids in db include subcategories in req.body (true / false)
        const checker = (items, arr) => items.every((item) => arr.includes(item))
        if (!checker(val, subCategoriesIdsInDB)) {
            return Promise.reject(new Error(`subcategories not belong to category`))
        }
    }
)),
    check('brand').optional().isNumeric().withMessage('Invalid ID format'),
    check('ratingsAverage').optional().isNumeric().withMessage('RatingsAverage must be a number').isLength({ max: 1 }).withMessage('Rating must be above or equal to 1.0').isLength({ max: 1 }).withMessage('Rating must be below or equal to 5.0'),
    check('ratingsQuantity').optional().isNumeric().withMessage('ratingsQuantity must be a number'),
        validatorMiddleware
]

exports.getProductValidator = [
    check('id').isMongoId().withMessage('Invalid ID format'),
        validatorMiddleware
]

exports.updateProductValidator = [
    check('id').isMongoId().withMessage('Invalid ID formate'),
    body('title').optional().custom((val, {req}) => {
        req.body.slug = slugify(val)
        return true;
    }),
        validatorMiddleware
];

exports.deleteProductValidator = [
    check('id').isMongoId().withMessage('Invalid ID formate'),
        validatorMiddleware
];