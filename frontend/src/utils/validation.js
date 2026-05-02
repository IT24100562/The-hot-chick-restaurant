export const trimSpaces = (value = '') => value.replace(/\s+/g, ' ').trim();

export const allowAlphaSpace = (value = '') => value.replace(/[^a-zA-Z ]/g, '');

export const allowNumeric = (value = '') => value.replace(/[^0-9]/g, '');

export const allowDecimal = (value = '') => value.replace(/[^0-9.]/g, '');

export const isAlphaSpace = (value = '') => /^[A-Za-z ]+$/.test(value.trim());

export const isEmail = (value = '') => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value.trim());

export const isPasswordStrong = (value = '') => value.length >= 6;

export const isNumeric = (value = '') => /^\d+$/.test(value);

export const isDecimal = (value = '') => /^\d+(\.\d{1,2})?$/.test(value);

export const isCardNumber = (value = '') => /^\d{16}$/.test(value);

export const isCardName = (value = '') => /^[A-Za-z ]+$/.test(value.trim()) && value.trim().length >= 3;

export const isExpiryValid = (value = '') => {
    const cleaned = String(value).replace(/[^0-9]/g, '');
    if (!/^(0[1-9]|1[0-2])\d{2}$/.test(cleaned)) return false;
    const month = Number(cleaned.slice(0, 2));
    const year = Number(`20${cleaned.slice(2, 4)}`);
    const expiryDate = new Date(year, month);
    const now = new Date();
    return expiryDate > now;
};

export const isCvv = (value = '') => /^\d{3}$/.test(value);
