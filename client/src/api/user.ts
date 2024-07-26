import { JsonResponse } from '@/constants/common';
import { UsersBasicDataRepo } from '@/constants/schema';
import axios from '@/helper/axios';
type IDataCreateNewUser = Omit<UsersBasicDataRepo, 'user_id' | 'authorization_id'> & {
  password: string;
  confirm_password: string;
};
export const createNewUser = async (data: IDataCreateNewUser) => {
  // if(data.)
  if (data.password !== data.confirm_password)
    return '"Confirm password" does not match "Password"';
  const response = await axios.post('/user/auth/signup', data);

  const isSuccess = response.status === 200;
  const responseData: JsonResponse = response.data;

  if (!isSuccess) return responseData.message;
  return true;
};
