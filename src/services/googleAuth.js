import { google } from 'googleapis';

// Store the access token in memory
let accessToken = null;
let tokenExpiry = null;

export const setAccessToken = (token, expiresIn) => {
  accessToken = token;
  tokenExpiry = Date.now() + (expiresIn * 1000);
};

export const getAccessToken = () => {
  if (!accessToken || Date.now() >= tokenExpiry) {
    return null;
  }
  return accessToken;
};

export const isTokenValid = () => {
  return accessToken && Date.now() < tokenExpiry;
};

export const clearToken = () => {
  accessToken = null;
  tokenExpiry = null;
};