import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Modal,
  Typography,
  Tag,
  Row,
  Col,
  message,
  Image
} from 'antd';
import EnhancedImagePreview from './EnhancedImagePreview';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';

import styled from 'styled-components';
import superagent from 'superagent';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
`;



const RecordItem = styled.div`
  margin-bottom: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f0f8ff;
    border-color: #91d5ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
  }
`;

const RecordYear = styled(Tag)`
  margin-right: 12px;
  font-weight: bold;
  border-radius: 4px;
`;



function PostList({ onEditPost }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    year: '',
    month: '',
    date: '',
    driver: '',
    team: ''
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

    const fetchPosts = async () => {
    setLoading(true);
    try {
      const query = Object.keys(searchParams)
        .filter(key => searchParams[key])
        .map(key => `${key}=${encodeURIComponent(searchParams[key])}`)
        .join('&');
      
      const response = await superagent.get(`/api/posts${query ? `?${query}` : ''}`);
      setPosts(response.body);
    } catch (error) {
      message.error('获取帖子列表失败');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [searchParams]);

  // 暴露刷新函数给父组件
  useEffect(() => {
    window.refreshPostList = fetchPosts;
    return () => {
      delete window.refreshPostList;
    };
  }, []);

  const handleSearch = () => {
    fetchPosts();
  };

  const handleReset = () => {
    setSearchParams({
      year: '',
      month: '',
      date: '',
      driver: '',
      team: ''
    });
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个帖子吗？',
      onOk: async () => {
        try {
          await superagent.delete(`/api/posts/${id}`);
          message.success('删除成功');
          fetchPosts();
        } catch (error) {
          message.error('删除失败');
          console.error('Error deleting post:', error);
        }
      }
    });
  };

  const showDetail = (post) => {
    setSelectedPost(post);
    setDetailModalVisible(true);
  };

  const exportToJson = (post) => {
    const dataStr = JSON.stringify(post, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `f1-history-${post.id}-${post.date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '简介',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => showDetail(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '添加日期',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      width: 350,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
                    <Button 
            type="default" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => onEditPost(record.id)}
          >
            编辑
          </Button>
          <Button
            type="default"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => exportToJson(record)}
          >
            导出
          </Button>
          <Button
            type="default"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <StyledCard title="搜索条件">
        <Row gutter={16}>
          <Col span={4}>
            <Input
              placeholder="年份 (如: 2024)"
              value={searchParams.year}
              onChange={(e) => setSearchParams({ ...searchParams, year: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="月份 (如: 05)"
              value={searchParams.month}
              onChange={(e) => setSearchParams({ ...searchParams, month: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="日期 (如: 26)"
              value={searchParams.date}
              onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
            />
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: '12px', lineHeight: '32px' }}>
              💡 提示：同时输入月份和日期可查询"历史上的今天"（如：月份05 + 日期26 = 查询5月26日的历史事件）
            </Text>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={4}>
            <Input
              placeholder="车手"
              value={searchParams.driver}
              onChange={(e) => setSearchParams({ ...searchParams, driver: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="车队"
              value={searchParams.team}
              onChange={(e) => setSearchParams({ ...searchParams, team: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </StyledCard>

      <StyledCard title="帖子列表">
        <Table
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
        />
      </StyledCard>

      <Modal
        title="帖子详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={900}
      >
        {selectedPost && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>日期：</Text>
              <Text>{selectedPost.date}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>简介：</Text>
              <Text>{selectedPost.summary}</Text>
            </div>

                         {selectedPost.records_en && selectedPost.records_en.length > 0 && (
               <div style={{ marginBottom: 16 }}>
                 <Title level={5}>英文记录：</Title>
                 {selectedPost.records_en.map((record, index) => (
                   <RecordItem key={index}>
                     <RecordYear color="blue">{record.year}</RecordYear>
                     <Text>{record.content}</Text>
                     {record.images && record.images.length > 0 && (
                       <EnhancedImagePreview 
                         images={record.images} 
                         title={`英文记录 ${record.year} 年图片`}
                       />
                     )}
                   </RecordItem>
                 ))}
               </div>
             )}
             
             {selectedPost.records_cn && selectedPost.records_cn.length > 0 && (
               <div>
                 <Title level={5}>中文记录：</Title>
                 {selectedPost.records_cn.map((record, index) => (
                   <RecordItem key={index}>
                     <RecordYear color="green">{record.year}</RecordYear>
                     <Text>{record.content}</Text>
                     {record.images && record.images.length > 0 && (
                       <EnhancedImagePreview 
                         images={record.images} 
                         title={`中文记录 ${record.year} 年图片`}
                       />
                     )}
                   </RecordItem>
                 ))}
               </div>
             )}

            {selectedPost.deaths && selectedPost.deaths.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>去世：</Title>
                {selectedPost.deaths.map((item) => (
                  <RecordItem key={`death-${item.id}`}>
                    <RecordYear color="red">{item.type === 'driver' ? '车手' : '车队'}</RecordYear>
                    <Text>{item.name_cn} ({item.name_en})</Text>
                    <Text style={{ marginLeft: 8, color: '#999' }}>ID: {item.entity_id}</Text>
                  </RecordItem>
                ))}
              </div>
            )}

            {selectedPost.champions && selectedPost.champions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>冠军：</Title>
                {selectedPost.champions.map((item) => (
                  <RecordItem key={`champ-${item.id}`}>
                    <RecordYear color="gold">{item.type === 'driver' ? '车手' : '车队'}</RecordYear>
                    <Text>{item.name_cn} ({item.name_en})</Text>
                    <Text style={{ marginLeft: 8, color: '#999' }}>ID: {item.entity_id}</Text>
                  </RecordItem>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PostList; 