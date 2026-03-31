const handle200 = (res, data = null) => {
    return res.status(200).json(data);
};

const handle201 = (res, data = null) => {
    return res.status(201).json(data);
};

const handle204 = (res, message = "Resource deleted successfully") => {
    return res.status(204).json({ message });
};

const handle400 = (res, message = "Bad Request") => {
    return res.status(400).json({ message });
};

const handle401 = (res, message = "Unauthorized") => {
    return res.status(401).json({ message });
};

const handle403 = (res, message = "Forbidden") => {
    return res.status(403).json({ message });
};

const handle404 = (res, message = "Not Found") => {
    return res.status(404).json({ message });
};

const handle422 = (res, error) => {
    const message = typeof error === 'string' ? error : (error?.message || "Unprocessable Entity");
    return res.status(422).json({ message });
};

const handle500 = (res, error) => {
    console.error("Internal Server Error:", error);
    const message = typeof error === 'string' ? error : (error?.message || "Internal Server Error");
    return res.status(500).json({ 
        message,
        error: process.env.NODE_ENV === 'production' ? undefined : error 
    });
};

module.exports = {
    handle200,
    handle201,
    handle204,
    handle400,
    handle401,
    handle403,
    handle404,
    handle422,
    handle500
};
