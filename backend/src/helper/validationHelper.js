const normalizeDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString);
};

const sanitizeMobile = (mobile) => {
    if (!mobile) return '';
    return mobile.replace(/\D/g, ''); // Removes any non-numeric characters
};

module.exports = {
    normalizeDate,
    sanitizeMobile
};
