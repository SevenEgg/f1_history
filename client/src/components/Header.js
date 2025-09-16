import React from 'react';
import { Layout, Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const StyledHeader = styled(AntHeader)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #001529;
  padding: 0 24px;
`;

const HeaderTitle = styled(Title)`
  color: white !important;
  margin: 0 !important;
`;

const HeaderButton = styled(Button)`
  background: #1890ff;
  border-color: #1890ff;
  color: white;
  
  &:hover {
    background: #40a9ff !important;
    border-color: #40a9ff !important;
    color: white !important;
  }
`;

function Header({ onAddPost }) {
  return (
    <StyledHeader>
      <HeaderTitle level={3}>F1历史上的今天管理后台</HeaderTitle>
      <HeaderButton 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={onAddPost}
      >
        新增帖子
      </HeaderButton>
    </StyledHeader>
  );
}

export default Header; 