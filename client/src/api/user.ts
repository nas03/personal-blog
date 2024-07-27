import { JsonResponse } from '@/constants/common';
import { Prettify, UsersBasicDataRepo } from '@/constants/schema';
import axios from '@/helper/axios';
import { AxiosError } from 'axios';

type IDataSignUp = Prettify<
  Omit<UsersBasicDataRepo, 'user_id' | 'authorization_id'> & {
    password: string;
    confirm_password: string;
  }
>;

type IDataSignIn = {
  email: string;
  password: string;
};

export const signUp = async (
  data: IDataSignUp,
): Promise<{ message: string; type: 'success' | 'error' }> => {
  try {
    if (data.password !== data.confirm_password)
      return { message: 'Confirm password does not match Password', type: 'error' };

    const payload: Omit<IDataSignUp, 'confirm_password'> = {
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
    };
  } catch (error) {
    const err = error as AxiosError;
    const response: { message: string; type: 'success' | 'error' } = {
      message: '',
      type: 'error',
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

export const signIn = async (
  data: IDataSignIn,
): Promise<{ message: string; type: 'success' | 'error' }> => {
  try {
    const responseSignIn = await axios.post('/user/auth/login', data, {
      withCredentials: true,
    });

    const isSuccess = responseSignIn.status === 200;
    const responseData: JsonResponse = responseSignIn.data;
    if (!isSuccess) return { message: responseData.message, type: 'error' };
    return {
      message: 'Success',
      type: 'success',
    };
  } catch (error) {
    const err = error as AxiosError;

    // Error 401: user_not_exists
    if (err.response?.status === 401) {
      return {
        message: 'Username or Password is incorrect!',
        type: 'error',
      };
    }

    return {
      message: (error as Error).message,
      type: 'error',
    };
  }
};
