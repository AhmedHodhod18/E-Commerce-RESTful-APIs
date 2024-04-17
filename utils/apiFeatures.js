class ApiFeatures  {
    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
    }

    // 1) filter
    filter() {
        const queryStringObj = {...this.queryString};
        const excludesFields = ['page', 'sort', 'limit', 'fields'];
        excludesFields.forEach((field) => delete queryStringObj[field])
    
        let queryStr = JSON.stringify(queryStringObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

        this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr))
        return this;
    }

    // 2) sorting
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ')
            this.mongooseQuery = this.mongooseQuery.sort(sortBy)
        } else {
            this.mongooseQuery = this.mongooseQuery.sort('-createdAt')
        }
        return this;
    }

    // 3) limiting
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ')
            this.mongooseQuery = this.mongooseQuery.select(fields)
        } else {
            this.mongooseQuery = this.mongooseQuery.select('-__v')
        }
        return this;
    }

    // 4) search
    // it returns as empty array, and I don't why it doesn't work ?!
    search(modelName) {
        if (this.queryString.keyword) {
            let query = {};
            if (modelName === 'Products') {
                query.$or = [
                    {title: {$regex: this.queryString.keyword, $options: 'i'}},
                    {description: {$regex: this.queryString.keyword, $options: 'i'}},
                ]
            } else {
                query = {name: {$regex: this.queryString.keyword, $options: 'i'}};
            }
            this.mongooseQuery = this.mongooseQuery.find(query);
        }
        return this;
    }



    // 5) pagination
    paginate(countDocuments) {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 50;
        const skip = (page - 1) * limit;
        const endIndex = page * limit;

        const pagination = {};
        pagination.currenPage = page;
        pagination.limit = limit;
        pagination.numberOfPages = Math.ceil(countDocuments / limit);

        if (endIndex < countDocuments) {
            pagination.next = page + 1;
        }
        if (skip > 0) {
            pagination.previous = page - 1;
        }

        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
        this.paginationResult = pagination;
        return this;
    }
}


module.exports = ApiFeatures;