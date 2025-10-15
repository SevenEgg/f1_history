import React, { useEffect, useState } from 'react';
import { Table, Breadcrumb, Button, Col, Form, Row, Select, Popconfirm, Pagination, message, Input, Modal, DatePicker, Image, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';

import {
    ContentCard,
    BlockHeader,
    BlockOptions,
    BlockTitle,
    BlockContent,
    ContentPadding,
    PaginationWrap
} from '../../components/Card';
import {
    ContentFarmPage,
} from "./styles";
import NewsManage from './Components/NewsManage';

const ContentFarm = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [newsData, setNewsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 35,
        total: 0
    });
    const [previewImage, setPreviewImage] = useState('');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [newsManageVisible, setNewsManageVisible] = useState(false);

    // 获取新闻数据
    const fetchNews = async (page = 1, pageSize = 35) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/news?page=${page}&limit=${pageSize}`);
            const data = await response.json();

            if (data.data) {
                setNewsData(data.data);
                setPagination({
                    current: data.currentPage || page,
                    pageSize: pageSize,
                    total: data.total || (data.totalPage * pageSize),
                    totalPage: data.totalPage,
                    hasNextPage: data.hasNextPage
                });
            }
        } catch (error) {
            message.error('获取新闻数据失败');
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    // 查看新闻详情
    const handleViewNews = (newsItem) => {
        // 确保传递完整的新闻数据，包括状态信息
        setSelectedNews({
            ...newsItem,
            status: newsItem.status || 'rejected' // 确保有状态信息
        });
        setNewsManageVisible(true);
    };

    // 处理新闻发布
    const handlePublishNews = async (publishData) => {
        console.log('发布新闻:', publishData);
        // 这里可以添加额外的发布后处理逻辑
    };

    // 处理新闻状态更新
    const handleStatusUpdate = (newsSlug, newStatus) => {
        // 更新本地新闻数据中的状态
        setNewsData(prevData =>
            prevData.map(item =>
                item.slug === newsSlug ? { ...item, status: newStatus } : item
            )
        );

        // 如果当前选中的新闻状态更新了，也要更新selectedNews
        if (selectedNews && selectedNews.slug === newsSlug) {
            setSelectedNews(prev => ({ ...prev, status: newStatus }));
        }
    };

    // 表格列配置
    const columns = [
        {
            title: '封面图片',
            dataIndex: 'cover_url',
            key: 'cover_url',
            width: 120,
            render: (url) => (
                url ? (
                    <Image
                        width={80}
                        height={60}
                        src={url}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        preview={{
                            visible: previewVisible,
                            src: previewImage,
                            onVisibleChange: (visible) => {
                                setPreviewVisible(visible);
                                if (!visible) setPreviewImage('');
                            }
                        }}
                        onClick={() => {
                            setPreviewImage(url);
                            setPreviewVisible(true);
                        }}
                    />
                ) : (
                    <div style={{ width: 80, height: 60, backgroundColor: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                        无图片
                    </div>
                )
            )
        },
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
            width: 300,
            ellipsis: true,
            render: (text) => (
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {text}
                </div>
            )
        },
        {
            title: '发布时间',
            dataIndex: 'published_at',
            key: 'published_at',
            width: 180,
            render: (text) => new Date(text).toLocaleString('zh-CN')
        },

        {
            title: '新闻来源',
            dataIndex: ['news_source', 'name'],
            key: 'news_source',
            width: 120,
            render: (text) => (
                <Tag color="blue">{text || '未知来源'}</Tag>
            )
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => (
                <Tag color={status === 'adopted' ? 'green' : 'red'}>
                    {status === 'adopted' ? '已采用' : '未采用'}
                </Tag>
            )
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewNews(record)}
                >
                    查看
                </Button>
            )
        }
    ];

    // 分页处理
    const handleTableChange = (pagination) => {
        // 更新URL参数
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', pagination.current);
        newSearchParams.set('pageSize', pagination.pageSize);
        setSearchParams(newSearchParams);
        
        fetchNews(pagination.current, pagination.pageSize);
    };

    useEffect(() => {
        // 从URL参数中读取初始状态
        const page = parseInt(searchParams.get('page')) || 1;
        const pageSize = parseInt(searchParams.get('pageSize')) || 35;
        
        // 更新状态
        setPagination(prev => ({ ...prev, current: page, pageSize }));
        
        // 获取数据
        fetchNews(page, pageSize);
    }, []);

    return (
        <ContentFarmPage>
            <Breadcrumb
                className='breadcrumb'
                items={[
                    { title: '首页' },
                    { title: '内容管理' },
                    { title: '内容农场' }
                ]}
            />

            <ContentCard>
                <BlockHeader>
                    <BlockTitle>F1新闻管理</BlockTitle>
                    <BlockOptions>
                        <Button
                            type="primary"
                            onClick={() => fetchNews(pagination.current, pagination.pageSize)}
                            loading={loading}
                        >
                            刷新数据
                        </Button>
                    </BlockOptions>
                </BlockHeader>
                <BlockContent>
                    <ContentPadding>
                        <Table
                            columns={columns}
                            dataSource={newsData}
                            rowKey="slug"
                            loading={loading}
                            pagination={{
                                current: pagination.current,
                                pageSize: pagination.pageSize,
                                total: pagination.total,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条 (第 ${pagination.current} 页/共 ${pagination.totalPage} 页)`,
                                pageSizeOptions: ['10', '20', '35', '50', '100'],
                                showLessItems: true,
                                hideOnSinglePage: false
                            }}
                            onChange={handleTableChange}
                            scroll={{ x: 1000 }}
                        />
                    </ContentPadding>
                </BlockContent>
            </ContentCard>

            <NewsManage
                visible={newsManageVisible}
                onClose={() => setNewsManageVisible(false)}
                newsData={selectedNews}
                onPublish={handlePublishNews}
                onStatusUpdate={handleStatusUpdate}
            />
        </ContentFarmPage>
    )
}

export default ContentFarm;