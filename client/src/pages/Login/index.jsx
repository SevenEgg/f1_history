import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { setLocalStorage } from '../../utils';
import { useNavigate } from 'react-router-dom';
import {
    LoginWrap,
    LoginFrame,
    TopFrame,
    TopLogoWrap,
    TopLogoText,
    TipsText,
    BotWrap,
    BotFrame
} from './styles';
// import { methods } from '../../utils/api';

const LoginPage = () => {
    const navigate = useNavigate();

    const onFinish = async (values) => {

        const { name, password } = values;
        console.log("values:", values);

        if (!name || !password) {
            message.warning('账号或密码不能为空！');
            return;
        }
        setLocalStorage('token', name);
        setLocalStorage('name', name);
        navigate('/');
        // const { success, data } = await methods.login({
        //     "loginType": "account",
        //     "name": name,
        //     "password": password
        // });

        // if (success) {
        //     setLocalStorage('token', data.data.token);
        //     setLocalStorage('name', name);
        //     navigate('/');

        //     return;
        // }
        // message.warning('账号密码错误!');
    }

    return (
        <LoginWrap>
            <LoginFrame>
                <TopFrame>
                    <TopLogoWrap>
                        <TopLogoText>围场小组件</TopLogoText>
                        <TipsText>F1内容管理平台</TipsText>
                    </TopLogoWrap>
                    <BotWrap>
                        <Form
                            name="normal_login"
                            initialValues={{}}
                            onFinish={onFinish}
                        >
                            <Form.Item
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message: '请输入您的账号!',
                                    },
                                ]}
                            >
                                <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="账号" />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message: '请输入您的密码!',
                                    },
                                ]}
                            >
                                <Input
                                    prefix={<LockOutlined className="site-form-item-icon" />}
                                    type="password"
                                    placeholder="密码"
                                />
                            </Form.Item>

                            <Button type="primary" htmlType="submit" size='large' block>
                                登录
                            </Button>

                        </Form>
                    </BotWrap>
                </TopFrame>
                <BotFrame></BotFrame>
            </LoginFrame>
        </LoginWrap>
    )
}

export default LoginPage;