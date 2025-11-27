const response = (res, result, status, message) => {
    const resultPrint = {}
    resultPrint.status = 'success'
    resultPrint.statusCode = status
    resultPrint.data = result
    resultPrint.message = message || null
    res.status(status).json(resultPrint)
}

module.exports = { response }