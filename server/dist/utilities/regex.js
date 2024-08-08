"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phoneNumberValidator = exports.emailValidator = void 0;
const emailValidator = (email) => {
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
};
exports.emailValidator = emailValidator;
const phoneNumberValidator = (phoneNumber) => {
    const regex = /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
    return regex.test(phoneNumber);
};
exports.phoneNumberValidator = phoneNumberValidator;
