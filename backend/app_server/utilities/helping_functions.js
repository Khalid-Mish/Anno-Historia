const sendResponse = (res, code, json) => {  
    res.status(code)
    res.json(json)
}

module.exports = { sendResponse }
