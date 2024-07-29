import { IResponseMessage } from '@/api/types/common';
import { ISignInData, ISignInResponse, ISignUpData } from '@/api/types/user_types';
import { JsonResponse } from '@/constants/common';
import axios from '@/helper/axios';
import { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

export const signUp = async (data: ISignUpData): Promise<IResponseMessage> => {
  try {
    if (data.password !== data.confirm_password)
      return { message: 'Confirm password does not match Password', type: 'error', data: null };

    const payload: Omit<ISignUpData, 'confirm_password'> = {
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number ? data.phone_number.trim() : null,
      email: data.email.trim(),
    };
    await axios.post('/user/auth/signup', payload);

    return {
      message: 'Success',
      type: 'success',
      data: null,
    };
  } catch (error) {
    const err = error as AxiosError;
    const response: IResponseMessage = {
      message: '',
      type: 'error',
      data: null,
    };
    // Network error
    if (!err.response) {
      response.message = err.message;
      return response;
    }

    // Status error handling
    const status = err.response.status;
    switch (status) {
      case 400:
        response.message = 'Invalid fields!';
        return response;
      case 409:
        response.message = 'This email has been used!';
        return response;
      case 500:
        response.message = 'System error!';
        return response;
      default:
        response.message = (err.response.data as JsonResponse).message;
        return response;
    }
  }
};

export const signIn = async (data: ISignInData): Promise<IResponseMessage> => {
  try {
    const responseSignIn = await axios.post('/user/auth/login', data, {
      withCredentials: true,
    });

    const responseData: ISignInResponse = responseSignIn.data;
    console.log(responseData)
    // Save data to local
    const { session_id, access_token } = responseData.data;
    const decodeToken = jwtDecode(access_token);
    localStorage.setItem('__SSID__', session_id);
    localStorage.setItem('auth._token._local', access_token);
    localStorage.setItem('auth._token_exp._local', String(decodeToken.exp));
    localStorage.setItem('auth.strategy', 'local');

    console.log({session_id, access_token, decodeToken})
    return {
      message: 'Success',
      type: 'success',
      data: null,
    };
  } catch (error) {
    const err = error as AxiosError;
    const errResponse: IResponseMessage = {
      message: '',
      type: 'error',
      data: null,
    };
    // Error 401: user_not_exists
    if (err.response?.status === 401) {
      errResponse.message = 'Username or Password is incorrect!';
      return errResponse;
    }
    errResponse.message = (error as Error).message;
    return errResponse;
  }
};

/* export const auth = async (): Promise<IResponseMessage> => {
  try {
    const responseAuth = await axios.post('/user/auth/auth');
    const response: IResponseMessage = {
      message: 'Success',
      type: 'error',
      data: null,
    };
    return response;
  } catch (error) {
    const errResponse: IResponseMessage = {
      message: '',
      type: undefined,
      data: null,
    };
    return errResponse;
  }
}; */
