import React, { useState } from 'react';
import { Layout } from 'antd';
import styled from 'styled-components';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import Header from './components/Header';

const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledContent = styled(Content)`
  padding: 24px;
  background: #f0f2f5;
`;

function App() {
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
      <Header onAddPost={handleAddPost} />
      <StyledContent>
        <PostList onEditPost={handleEditPost} />
      </StyledContent>
      <PostForm
        visible={drawerVisible}
        postId={editingPostId}
        onClose={handleDrawerClose}
        onSuccess={handlePostSuccess}
      />
    </StyledLayout>
  );
}

export default App; 