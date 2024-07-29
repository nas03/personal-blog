import { Link, redirect } from 'react-router-dom';

import api from '@/api';
import { IResponseMessage } from '@/api/types/common';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { noSpecialCharacterRegex, phoneNumberRegex } from '@/constants/regex';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Form, Select } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useState } from 'react';
export default function SignUp() {
  // Form
  const [signUpForm] = useForm();

  // States
  const [responseMessage, setResponseMessage] = useState<IResponseMessage>({
    message: '',
    type: undefined,
    data: null,
  });

  // Form submission handling
  const { data, isLoading } = useQuery({
    queryKey: ['m_countries', 'all'],
    queryFn: api.m_countries.getCountriesData,
  });

  // FORM HANDLING
  const { mutate } = useMutation({
    mutationFn: api.user.signUp,
    onSuccess: (res) => {
      setResponseMessage(res);
      if (res.type === 'success') {
        return redirect('/login');
      }
    },
    
  });

  if (isLoading) return <Loader />;

  return (
    <>
      <Card className="mx-auto max-w-sm bg-cwhite">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
          {responseMessage.message !== '' && (
            <Alert message={responseMessage.message} type={responseMessage.type} showIcon />
          )}
        </CardHeader>
        <CardContent>
          <Form
            form={signUpForm}
            onFinish={() =>
              mutate(signUpForm.getFieldsValue(), {
                onSuccess: (res) => {
                  console.log({res})
                  if (res.type === 'success') redirect('/login');
                },
              })
            }>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Form.Item<string>
                    initialValue={''}
                    name="first_name"
                    rules={[
                      {
                        required: true,
                        pattern: noSpecialCharacterRegex,
                        message: 'Your name cannot include special characters',
                      },
                    ]}
                    validateTrigger={['onChange']}
                    hasFeedback>
                    <Input id="first-name" className="bg-cwhite" placeholder="Max" required />
                  </Form.Item>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Form.Item<string>
                    initialValue={''}
                    name="last_name"
                    validateTrigger={['onChange']}
                    hasFeedback
                    rules={[
                      {
                        required: true,
                        message: 'Your name cannot include special characters',
                        pattern: noSpecialCharacterRegex,
                      },
                    ]}>
                    <Input id="last-name" className="bg-cwhite" placeholder="Robinson" required />
                  </Form.Item>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Form.Item<string>
                  initialValue={''}
                  name="email"
                  rules={[{ required: true, message: 'Please input your email' }]}>
                  <Input
                    id="email"
                    className="bg-cwhite"
                    type="email"
                    placeholder="email@example.com"
                    required
                  />
                </Form.Item>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone-number" className="h-fit">
                  Phone Number
                </Label>
                <div className="grid h-[2.5rem] grid-cols-5 gap-2">
                  <Select className="col-span-2 h-[2.5rem]" defaultValue={'VN'}>
                    {data?.map((country) => (
                      <Select.Option key={country.country_code}>
                        <span className="flex w-fit flex-row items-center capitalize">
                          <img
                            src={`/flags/${country.country_code}.svg`}
                            className="w-[32px] rounded-sm"
                          />
                          {country.country_number}
                        </span>
                      </Select.Option>
                    ))}
                  </Select>

                  <Form.Item<string>
                    initialValue={''}
                    name="phone_number"
                    className="col-span-3 h-[2.5rem]"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter your phone number',
                        pattern: phoneNumberRegex,
                      },
                    ]}>
                    <Input
                      id="phone-number"
                      className="h-[2.5rem] bg-cwhite"
                      type="phone_number"
                      placeholder="Phone number"
                      required
                    />
                  </Form.Item>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Form.Item<string>
                  initialValue={''}
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password' }]}>
                  <Input className="bg-cwhite" id="password" type="password" />
                </Form.Item>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Form.Item<string>
                  initialValue={''}
                  name="confirm_password"
                  rules={[{ required: true, message: 'Please enter your password again' }]}>
                  <Input className="bg-cwhite" id="confirm-password" type="password" />
                </Form.Item>
              </div>
              <Button type="submit" className="w-full bg-cgreen">
                Create an account
              </Button>
              <Button
                variant="outline"
                className="w-full bg-cwhite hover:bg-cblue hover:text-cwhite">
                Sign up with GitHub
              </Button>
            </div>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="#" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
