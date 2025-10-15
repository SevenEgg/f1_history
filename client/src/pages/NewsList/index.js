import React, { useEffect, useState } from 'react';
import { Table, Breadcrumb, Button, Image, Tag, Input, message, Popconfirm, Modal, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, PlusOutlined, CloudSyncOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { TAG_LABEL_MAP } from '../../constants/tags';
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
    NewsListPage,
} from './styles';
import NewsManage from './Components/NewsManage';

const { Search } = Input;

const NewsList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [newsData, setNewsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [searchText, setSearchText] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [selectedNews, setSelectedNews] = useState(null);
    const [newsManageVisible, setNewsManageVisible] = useState(false);
    const [publishModalVisible, setPublishModalVisible] = useState(false);
    const [publishSlug, setPublishSlug] = useState('');
    const [publishLoading, setPublishLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);

    // 获取已发布新闻数据
    const fetchPublishedNews = async (page = 1, pageSize = 10, search = '') => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/published-news?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}`);
            const data = await response.json();

            if (data.data) {
                setNewsData(data.data);
                setPagination({
                    current: data.pagination.current,
                    pageSize: data.pagination.pageSize,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages,
                    hasNextPage: data.pagination.hasNextPage,
                    hasPrevPage: data.pagination.hasPrevPage
                });
            }
        } catch (error) {
            message.error('获取新闻数据失败');
            console.error('Error fetching published news:', error);
        } finally {
            setLoading(false);
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
                        placeholder={
                            <div style={{ width: 80, height: 60, backgroundColor: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                加载中...
                            </div>
                        }
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
                <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {text}
                </div>
            )
        },
        {
            title: '摘要',
            dataIndex: 'summary',
            key: 'summary',
            width: 250,
            ellipsis: true,
            render: (text) => (
                <div style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {text}
                </div>
            )
        },
        {
            title: '发布时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
            render: (text) => new Date(text).toLocaleString('zh-CN')
        },
        // {
        //     title: '同步状态',
        //     dataIndex: 'syncSta',
        //     key: 'syncSta',
        //     width: 100,
        //     render: (val) => (
        //         val ? <Tag color="green">已同步</Tag> : <Tag color="default">未同步</Tag>
        //     )
        // },
        {
            title: '新闻来源',
            dataIndex: 'news_source',
            key: 'news_source',
            width: 120,
            render: (text) => (
                <Tag color="blue">{text || '未知来源'}</Tag>
            )
        },
        {
            title: '标签',
            dataIndex: 'tags',
            key: 'tags',
            width: 150,
            render: (tags) => (
                <div>
                    {tags && tags.length > 0 ? (
                        tags.slice(0, 2).map((tag, index) => (
                            <Tag key={index} color="green" style={{ marginBottom: 2 }}>
                                {TAG_LABEL_MAP[tag] || tag}
                            </Tag>
                        ))
                    ) : (
                        <span style={{ color: '#999' }}>无标签</span>
                    )}
                    {tags && tags.length > 2 && (
                        <Tag color="default">+{tags.length - 2}</Tag>
                    )}
                </div>
            )
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    {record.syncSta ? (
                        <Tag color="green">已同步</Tag>
                    ) : (
                        <Button
                            type="text"
                            icon={<CloudSyncOutlined />}
                            onClick={async () => {
                                try {
                                    const resp = await fetch(`http://localhost:3001/api/newItem/${record.slug}`);
                                    const data = await resp.json();
                                    if (resp.ok && data && data.success) {
                                        message.success('已同步并导出JSON');
                                        // 自动下载该条 JSON
                                        const url = data.oss && data.oss.url ? data.oss.url : '';
                                        if (url) {
                                            const absoluteUrl = url.startsWith('http') ? url : `http://localhost:3001${url}`;
                                            try {
                                                const fileResp = await fetch(absoluteUrl);
                                                const blob = await fileResp.blob();
                                                const blobUrl = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = blobUrl;
                                                a.download = `${record.slug}.json`;
                                                document.body.appendChild(a);
                                                a.click();
                                                a.remove();
                                                window.URL.revokeObjectURL(blobUrl);
                                            } catch (e) {
                                                console.error('下载单条 JSON 失败:', e);
                                            }
                                        }
                                        // 同步后刷新列表，拿到最新 syncSta
                                        setTimeout(() => {
                                            fetchPublishedNews(pagination.current, pagination.pageSize, searchText);
                                        }, 500);
                                    } else {
                                        message.error((data && data.error) || '同步失败');
                                    }
                                } catch (e) {
                                    message.error('同步失败');
                                }
                            }}
                            size="small"
                        >
                            同步
                        </Button>
                    )}
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        size="small"
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除这条新闻吗？"
                        description="删除后将无法恢复"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            loading={deletingId === record.id}
                            size="small"
                        >
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
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
        
        fetchPublishedNews(pagination.current, pagination.pageSize, searchText);
    };

    // 搜索处理
    const handleSearch = (value) => {
        setSearchText(value);
        // 搜索时重置到第一页并更新URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', 1);
        newSearchParams.set('search', value);
        setSearchParams(newSearchParams);
        
        fetchPublishedNews(1, pagination.pageSize, value);
    };

    // 刷新数据
    const handleRefresh = () => {
        fetchPublishedNews(pagination.current, pagination.pageSize, searchText);
    };

    // 同步 newsList 到本地与 OSS
    const handleSync = async () => {
        setSyncLoading(true);
        try {
            const resp = await fetch('http://localhost:3001/api/newList');
            const data = await resp.json();
            if (resp.ok && data && data.success) {
                message.success('同步成功');
                // 自动下载 JSON 到本地
                const url = data.oss && data.oss.url ? data.oss.url : '';
                if (url) {
                    const absoluteUrl = url.startsWith('http') ? url : `http://localhost:3001${url}`;
                    try {
                        const fileResp = await fetch(absoluteUrl);
                        const blob = await fileResp.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = 'newsList.json';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(blobUrl);
                    } catch (e) {
                        // 下载失败不阻塞成功提示
                        console.error('下载 newsList.json 失败:', e);
                    }
                }
            } else {
                message.error((data && data.error) || '同步失败');
            }
        } catch (e) {
            message.error('同步失败');
        } finally {
            setSyncLoading(false);
        }
    };

    // 删除新闻
    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            const response = await fetch(`http://localhost:3001/api/published-news/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                message.success('新闻删除成功');
                // 删除成功后刷新数据
                fetchPublishedNews(pagination.current, pagination.pageSize, searchText);
            } else {
                message.error(data.error || '删除失败');
            }
        } catch (error) {
            message.error('删除失败，请重试');
            console.error('Error deleting news:', error);
        } finally {
            setDeletingId(null);
        }
    };

    // 编辑新闻
    const handleEdit = (newsItem) => {
        setSelectedNews(newsItem);
        setNewsManageVisible(true);
    };

    // 发布新闻
    const handlePublish = async () => {
        if (!publishSlug.trim()) {
            message.warning('请输入新闻slug');
            return;
        }

        setPublishLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/published-news/publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ slug: publishSlug.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                message.success('新闻发布成功');
                setPublishModalVisible(false);
                setPublishSlug('');
                // 发布成功后刷新数据
                fetchPublishedNews(pagination.current, pagination.pageSize, searchText);
            } else {
                message.error(data.error || '发布失败');
            }
        } catch (error) {
            message.error('发布失败，请重试');
            console.error('Error publishing news:', error);
        } finally {
            setPublishLoading(false);
        }
    };

    // 处理新闻更新
    const handleNewsUpdate = (updateData) => {
        // 更新本地数据
        setNewsData(prevData =>
            prevData.map(item =>
                item.id === selectedNews.id ? { ...item, ...updateData } : item
            )
        );
        // 更新selectedNews
        setSelectedNews(prev => ({ ...prev, ...updateData }));
    };

    useEffect(() => {
        // 从URL参数中读取初始状态
        const page = parseInt(searchParams.get('page')) || 1;
        const pageSize = parseInt(searchParams.get('pageSize')) || 10;
        const search = searchParams.get('search') || '';
        
        // 更新状态
        setPagination(prev => ({ ...prev, current: page, pageSize }));
        setSearchText(search);
        
        // 获取数据
        fetchPublishedNews(page, pageSize, search);
    }, []);

    return (
        <NewsListPage>
            <Breadcrumb className='breadcrumb' items={[
                { title: '首页' },
                { title: '内容管理' },
                { title: '新闻列表' }
            ]} />

            <BlockHeader className='mb16'>
                <BlockTitle>已发布新闻列表</BlockTitle>
                <BlockOptions>
                    <Search
                        placeholder="搜索新闻标题"
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="middle"
                        onSearch={handleSearch}
                        style={{ width: 300, marginRight: 8 }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setPublishModalVisible(true)}
                        className='mr8'
                    >
                        发布
                    </Button>
                    <Button
                        type="primary"
                        icon={<CloudSyncOutlined />}
                        onClick={handleSync}
                        loading={syncLoading}
                        className='mr8'
                    >
                        同步
                    </Button>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={loading}
                    >
                        刷新
                    </Button>
                </BlockOptions>
            </BlockHeader>

            <ContentCard>
                <ContentPadding>
                    <Table
                        columns={columns}
                        dataSource={newsData}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            showLessItems: true,
                            hideOnSinglePage: false
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1200 }}
                    />
                </ContentPadding>
            </ContentCard>

            {/* 发布新闻模态框 */}
            <Modal
                title="发布新闻"
                open={publishModalVisible}
                onOk={handlePublish}
                onCancel={() => {
                    setPublishModalVisible(false);
                    setPublishSlug('');
                }}
                confirmLoading={publishLoading}
                okText="发布"
                cancelText="取消"
            >
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                        新闻 Slug:
                    </label>
                    <Input
                        placeholder="请输入新闻的slug（从F1 Cosmos API获取）"
                        value={publishSlug}
                        onChange={(e) => setPublishSlug(e.target.value)}
                        onPressEnter={handlePublish}
                    />
                    <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                        提示：slug是新闻的唯一标识符，可以从F1 Cosmos API的新闻详情中获取
                    </div>
                </div>
            </Modal>

            {/* 新闻管理抽屉 */}
            <NewsManage
                visible={newsManageVisible}
                onClose={() => setNewsManageVisible(false)}
                newsData={selectedNews}
                onUpdate={handleNewsUpdate}
            />

        </NewsListPage>
    )
}

export default NewsList;