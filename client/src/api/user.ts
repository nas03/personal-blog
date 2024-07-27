import { JsonResponse } from '@/constants/common';
import { UsersBasicDataRepo } from '@/constants/schema';
import axios from '@/helper/axios';

type IDataSignUp = Omit<UsersBasicDataRepo, 'user_id' | 'authorization_id'> & {
  password: string;
  confirm_password: string;
};

type IDataSignIn = {
  email: string;
  password: string;
};
export const signUp = async (data: IDataSignUp) => {
  // if(data.)
  if (data.password !== data.confirm_password)
    return '"Confirm password" does not match "Password"';
  const response = await axios.post('/user/auth/signup', data);

  const isSuccess = response.status === 200;
  const responseData: JsonResponse = response.data;

  if (!isSuccess) return responseData.message;
  return true;
};

export const signIn = async (data: IDataSignIn) => {
  const responseSignIn = await axios.post('/user/auth/login', data);

  const isSuccess = responseSignIn.status === 200;
  const responseData: JsonResponse = responseSignIn.data;
  if (!isSuccess) return responseData.message;
  return true;
};
