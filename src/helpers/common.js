const response = (res, result, status, message) => {
    const isSuccess = status >= 200 && status < 300;
    
    const resultPrint = {
        success: isSuccess,
        message: message || (isSuccess ? 'Success' : 'Error'),
        data: result
    };
    
    res.status(status).json(resultPrint);
};

const success = (res, data = null, message = 'Success', status = 200) => {
    res.status(status).json({
        success: true,
        message,
        data
    });
};

const error = (res, message = 'Internal server error', status = 500, errors = null) => {
    const response = {
        success: false,
        message
    };
    
    if (errors && errors.length > 0) {
        response.errors = errors;
    }
    
    res.status(status).json(response);
};

const paginated = (res, data, pagination, message = 'Success') => {
    res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            current_page: pagination.page,
            total_pages: pagination.total_pages,
            total_items: pagination.total_items,
            per_page: pagination.per_page || pagination.limit,
            has_next: pagination.page < pagination.total_pages,
            has_prev: pagination.page > 1
        }
    });
};

const created = (res, data, message = 'Resource created successfully') => {
    res.status(201).json({
        success: true,
        message,
        data
    });
};

const noContent = (res) => {
    res.status(204).send();
};

const validationError = (res, errors) => {
    res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.map(err => ({
            field: err.param || err.field,
            message: err.msg || err.message
        }))
    });
};

const unauthorized = (res, message = 'Unauthorized. Please login first.') => {
    res.status(401).json({
        success: false,
        message
    });
};

const forbidden = (res, message = 'You do not have permission to access this resource') => {
    res.status(403).json({
        success: false,
        message
    });
};

const notFound = (res, message = 'Resource not found') => {
    res.status(404).json({
        success: false,
        message
    });
};

const badRequest = (res, message = 'Bad request') => {
    res.status(400).json({
        success: false,
        message
    });
};

module.exports = {
    response,
    success,
    error,
    paginated,
    created,
    noContent,
    validationError,
    unauthorized,
    forbidden,
    notFound,
    badRequest
};