import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, Card, Typography, AutoComplete, message, ConfigProvider, theme } from 'antd';
import { User, Lock, LogIn } from 'lucide-react';

const { Title, Text } = Typography;

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<{ value: string }[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [form] = Form.useForm();

    const handleSearch = (value: string) => {
        if (!value || value.includes('@')) {
            setOptions([]);
        } else {
            setOptions(['@163.com', '@sina.com', '@gmail.com', '@qq.com', '@outlook.com'].map((domain) => ({
                value: `${value}${domain}`,
            })));
        }
    };

    useEffect(() => {
        const lastEmail = localStorage.getItem('last_email');
        if (lastEmail) {
            form.setFieldsValue({ email: lastEmail });
        }
    }, [form]);

    const onFinish = async (values: any) => {
        setLoading(true);
        // Mock login delay
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            // Mock successful login object
            const mockUser = {
                id: '1',
                email: values.email,
                name: values.email.split('@')[0],
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + values.email
            };

            messageApi.success('Login successful');

            // Handle persistence
            if (values.remember) {
                localStorage.setItem('login_token', JSON.stringify(mockUser));
                localStorage.setItem('last_email', values.email); // Remember email for next time
            } else {
                sessionStorage.setItem('login_token', JSON.stringify(mockUser));
                localStorage.setItem('last_email', values.email); // Still remember email for convenience
            }

            onLoginSuccess(mockUser);
        } catch (error) {
            messageApi.error('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#10a37f', borderRadius: 8 } }}>
            {contextHolder}
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#0f1117',
                backgroundImage: 'radial-gradient(circle at 50% 50%, #1f2129 0%, #0f1117 100%)'
            }}>
                <Card style={{ width: 400, background: '#1e1e1e', border: '1px solid #303030', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ width: 48, height: 48, background: '#10a37f', borderRadius: 12, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User color="white" size={24} />
                        </div>
                        <Title level={3} style={{ margin: 0, color: 'white' }}>Welcome Back</Title>
                        <Text type="secondary">Sign in to your account</Text>
                    </div>

                    <Form
                        form={form}
                        name="login"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please input your email!' },
                                { type: 'email', message: 'Please enter a valid email!' }
                            ]}
                        >
                            <AutoComplete
                                placeholder="Email"
                                onSearch={handleSearch}
                                options={options}
                            >
                                <Input prefix={<User size={16} className="text-gray-400" />} />
                            </AutoComplete>
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password
                                prefix={<Lock size={16} className="text-gray-400" />}
                                placeholder="Password"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox>Remember me</Checkbox>
                            </Form.Item>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block icon={<LogIn size={16} />} style={{ background: '#10a37f' }}>
                                Log in
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </ConfigProvider>
    );
};

export default Login;
