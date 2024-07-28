import { UsersBasicDataRepo } from '@/constants/schema';

export type ISignUpData = Omit<UsersBasicDataRepo, 'user_id' | 'authorization_id'> & {
  password: string;
  confirm_password: string;
};

export type ISignInData = {
  email: string;
  password: string;
};

export type ISignInResponse = {
  status: 'error' | 'success';
  message: string;
  data: {
    session_id: string;
    access_token: string;
  };
};
