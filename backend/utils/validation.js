const isAlphaSpace = (value = '') => /^[A-Za-z ]+$/.test(String(value).trim());

const isEmail = (value = '') => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(String(value).trim());

const isNumeric = (value) => /^\d+$/.test(String(value));

const isDecimal = (value) => /^\d+(\.\d{1,2})?$/.test(String(value));

const trimSpaces = (value = '') => String(value).replace(/\s+/g, ' ').trim();

module.exports = {
    isAlphaSpace,
    isEmail,
    isNumeric,
    isDecimal,
    trimSpaces,
};
