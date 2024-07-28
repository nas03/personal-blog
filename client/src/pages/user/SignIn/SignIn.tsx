import api from '@/api';
import { IResponseMessage } from '@/api/types/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { Alert, Checkbox, Form } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useState } from 'react';
import { Link } from 'react-router-dom';
export default function SignIn() {
  // Form
  const [signInForm] = useForm();
  
  // States
  const [responseMessage, setResponseMessage] = useState<IResponseMessage>({
    message: '',
    type: undefined,
    data: null,
  });

  // Handle form submit
  const { mutate } = useMutation({
    mutationFn: api.user.signIn,
    onSuccess: (res) => {
      setResponseMessage(res);
    },
  });

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
        {responseMessage.message !== '' && (
          <Alert message={responseMessage.message} type={responseMessage.type} showIcon />
        )}
      </CardHeader>
      <CardContent>
        <Form form={signInForm} onFinish={() => mutate(signInForm.getFieldsValue())}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Form.Item name={'email'} required initialValue={''}>
                <Input id="email" type="email" placeholder="m@example.com" required />
              </Form.Item>
            </div>
            <div className="grid max-h-[3.5rem] gap-2">
              <Label htmlFor="password">Password</Label>
              <Form.Item name={'password'} required initialValue={''}>
                <Input id="password" type="password" required />
              </Form.Item>
            </div>
            <div className="flex h-[2rem] flex-row items-center justify-start gap-2">
              <Form.Item
                className="m-0"
                name={'staySignedIn'}
                valuePropName="checked"
                initialValue={false}>
                <Checkbox id="checkbox" className="max-w-[1rem]" />
              </Form.Item>
              <Label htmlFor="checkbox" className="text-sm">
                Remember me
              </Label>
              <Link to="#" className="ml-auto text-sm underline">
                Forgot your password?
              </Link>
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link to="#" className="underline">
              Sign up
            </Link>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
