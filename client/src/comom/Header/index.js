import { removeLocalStorage, getLocalStorage } from '../../utils';
import { useNavigate } from 'react-router-dom';
import { Popconfirm } from 'antd';
import {
    Header,
    HeaderContent,
    HeaderRight
} from './styles';


function Headers() {
    const navigate = useNavigate();
    const name = getLocalStorage('name');

    return (
        <Header>
            <HeaderContent>
                <HeaderRight>
                    <div className="welcomeText">您好，{name}</div>
                    <div className="line">|</div>
                    <Popconfirm title="确定退出登录吗？" onConfirm={() => {
                        removeLocalStorage('name');
                        removeLocalStorage('token');
                        navigate('/login');
                    }}>
                        <div className="loginOut">退出登录</div>
                    </Popconfirm>
                </HeaderRight>
            </HeaderContent>
        </Header>
    )
}


export default Headers;