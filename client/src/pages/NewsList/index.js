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
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
            // render: (text) => new Date(text).toLocaleString('zh-CN')
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
                        <Popconfirm
                            title="确认要重置同步吗？"
                            description="重置后该新闻将变为未同步状态"
                            onConfirm={async () => {
                                try {
                                    const resp = await fetch('http://localhost:3001/api/debug/reset-sync', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ 
                                            slug: record.slug, 
                                            pwd: 'yali1990' 
                                        }),
                                    });
                                    const data = await resp.json();
                                    if (resp.ok && data && data.success) {
                                        message.success('重置同步状态成功');
                                        // 重置后刷新列表，拿到最新 syncSta
                                        setTimeout(() => {
                                            fetchPublishedNews(pagination.current, pagination.pageSize, searchText);
                                        }, 500);
                                    } else {
                                        message.error((data && data.error) || '重置失败');
                                    }
                                } catch (e) {
                                    message.error('重置失败');
                                }
                            }}
                            okText="确认"
                            cancelText="取消"
                        >
                            <Tag color="green" style={{ cursor: 'pointer' }}>已同步</Tag>
                        </Popconfirm>
                    ) : (
                        <Button
                            type="text"
                            icon={<CloudSyncOutlined />}
                            onClick={async () => {
                                try {
                                    // 创建带超时的 fetch 请求
                                    const controller = new AbortController();
                                    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时
                                    
                                    let resp;
                                    try {
                                        resp = await fetch(`http://localhost:3001/api/newItem/${record.slug}`, {
                                            signal: controller.signal
                                        });
                                    } catch (fetchError) {
                                        clearTimeout(timeoutId);
                                        if (fetchError.name === 'AbortError') {
                                            throw new Error('请求超时，请稍后重试');
                                        }
                                        throw new Error(`网络错误: ${fetchError.message}`);
                                    }
                                    clearTimeout(timeoutId);
                                    
                                    let data;
                                    try {
                                        data = await resp.json();
                                    } catch (jsonError) {
                                        console.error('解析响应失败:', jsonError);
                                        throw new Error('服务器响应格式错误');
                                    }
                                    
                                    if (resp.ok && data) {
                                        // 检查整体成功和 OSS 上传成功
                                        if (data.success && data.oss && data.oss.success) {
                                            message.success('已同步并导出JSON到OSS');
                                            // 自动下载该条 JSON
                                            const url = data.oss.url;
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
                                            // OSS 上传失败
                                            const errorMsg = data.error || (data.oss && data.oss.error) || '同步失败';
                                            message.warning(`本地文件已保存，但OSS上传失败: ${errorMsg}`);
                                            console.error('同步失败详情:', data);
                                        }
                                    } else {
                                        message.error((data && data.error) || '同步失败');
                                        console.error('同步失败:', data);
                                    }
                                } catch (e) {
                                    const errorMsg = e.message || '同步失败';
                                    message.error(errorMsg);
                                    console.error('同步异常:', e);
                                    // 如果是网络错误，提供更多信息
                                    if (e.message.includes('Failed to fetch') || e.message.includes('网络错误')) {
                                        console.error('可能的原因:');
                                        console.error('1. 服务器未运行或无法访问');
                                        console.error('2. 网络连接问题');
                                        console.error('3. CORS 配置问题');
                                        console.error('4. 服务器处理时间过长导致超时');
                                    }
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
        // 提示用户同步可能需要较长时间
        message.info('开始同步，数据量较大时可能需要1-2分钟，请耐心等待...', 3);
        
        try {
            // 添加超时控制（120秒，因为后端处理大量数据可能需要较长时间）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);
            
            const resp = await fetch('http://localhost:3001/api/newList', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!resp.ok) {
                const errorText = await resp.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText || `HTTP ${resp.status} ${resp.statusText}` };
                }
                throw new Error(errorData.error || `请求失败: ${resp.status}`);
            }
            
            const data = await resp.json();
            if (resp.ok && data && data.success) {
                // 检查 OSS 上传状态
                if (data.oss && data.oss.success) {
                    message.success(`同步成功！共 ${data.count || 0} 条新闻`);
                    // 自动下载 JSON 到本地
                    const url = data.oss.url;
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
                    // OSS 上传失败，但本地文件已保存
                    const ossError = data.oss && data.oss.error ? data.oss.error : '未知错误';
                    message.warning(`本地文件已保存，但 OSS 上传失败: ${ossError}`);
                    console.error('OSS上传失败详情:', data.oss);
                }
            } else {
                // 接口返回失败
                const errorMsg = data && data.error ? data.error : '同步失败，请检查服务器日志';
                message.error(errorMsg);
                console.error('同步失败:', data);
            }
        } catch (e) {
            // 处理各种错误类型
            if (e.name === 'AbortError' || e.message === 'The user aborted a request.') {
                message.error('同步请求超时（120秒），数据量可能较大，请稍后重试或联系管理员');
            } else if (e.message && e.message.includes('Failed to fetch')) {
                message.error('网络连接失败，请检查服务器是否正常运行');
            } else if (e.message && e.message.includes('NetworkError')) {
                message.error('网络错误，请检查网络连接');
            } else {
                const errorMsg = e.message || '未知错误';
                message.error(`同步失败: ${errorMsg}`);
            }
            console.error('同步请求异常:', e);
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