import React, { useState } from 'react';
import { Layout, Button } from 'antd';
import styled from 'styled-components';
import PostList from '../../components/PostList';
import PostForm from '../../components/PostForm';
const { Content } = Layout;

const StyledLayout = styled(Layout)`
`;

const StyledContent = styled(Content)`
  background: #f0f2f5;
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


const F1History = () => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);


    const handleAddPost = () => {
        setEditingPostId(null);
        setDrawerVisible(true);
    };

    const handleEditPost = (postId) => {
        setEditingPostId(postId);
        setDrawerVisible(true);
    };

    const handleDrawerClose = () => {
        setDrawerVisible(false);
        setEditingPostId(null);
    };

    const handlePostSuccess = () => {
        // 触发帖子列表刷新
        if (window.refreshPostList) {
            window.refreshPostList();
        }
    };
    return (
        <StyledLayout>
            <StyledContent>
                <PostList onEditPost={handleEditPost} onAddPost={handleAddPost}/>
            </StyledContent>
            <PostForm
                visible={drawerVisible}
                postId={editingPostId}
                onClose={handleDrawerClose}
                onSuccess={handlePostSuccess}
            />
        </StyledLayout>
    );
};

export default F1History;